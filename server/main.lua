local playerQueues = {}
local pendingGroupRequests = {} -- nova tabela para acompanhar grupos de requests

local function ensureQueue(src)
    if not playerQueues[src] then playerQueues[src] = {} end
    return playerQueues[src]
end

local function shallowCopy(t)
    if type(t) ~= 'table' then return t end
    local o = {}
    for k, v in pairs(t) do o[k] = v end
    return o
end

local function SendRequestAndWait(targets, requestData, timeoutMs)
    timeoutMs = timeoutMs or (Config and Config.DefaultTimeout) or 15000
    if type(targets) ~= 'table' then return {} end

    local groupId = tostring(os.time()) .. tostring(math.random(1000,9999))
    pendingGroupRequests[groupId] = {
        results = {},
        created = GetGameTimer(),
        canceled = false
    }

    for _, targetId in ipairs(targets) do
        if tonumber(targetId) then
            local rd = shallowCopy(requestData or {})
            rd.groupId = groupId
            rd.id = rd.id or (tostring(os.time()) .. tostring(math.random(1000,9999)))
            rd.timeout = rd.timeout or timeoutMs
            TriggerEvent('g5-request:server:send', tonumber(targetId), rd)
        end
    end

    local waitUntil = GetGameTimer() + timeoutMs
    while GetGameTimer() < waitUntil do
        local allReceived = true
        for _, targetId in ipairs(targets) do
            if pendingGroupRequests[groupId].results[tonumber(targetId)] == nil then
                allReceived = false
                break
            end
        end
        if allReceived then break end
        Wait(50)
    end

    local results = {}
    for _, targetId in ipairs(targets) do
        local tid = tonumber(targetId)
        local entry = pendingGroupRequests[groupId].results[tid]
        if entry == nil then
            if pendingGroupRequests[groupId].canceled then
                results[tid] = { answered = false, accepted = false, timedOut = false, canceled = true }
            else
                results[tid] = { answered = false, accepted = false, timedOut = true, canceled = false }
            end
        else
            results[tid] = {
                answered = entry.answered == true,
                accepted = entry.accepted == true,
                timedOut = entry.timedOut == true,
                canceled = entry.canceled == true
            }
        end
    end

    pendingGroupRequests[groupId] = nil
    return results
end

exports('sendAndWait', SendRequestAndWait)

RegisterNetEvent('g5-request:server:send', function(target, requestData)
    local src = source
    if not target or not requestData then return end
    requestData.id = requestData.id or (tostring(os.time()) .. tostring(math.random(1000,9999)))
    requestData.from = requestData.from or src
    requestData.timeout = requestData.timeout or 15000

    local q = ensureQueue(target)
    table.insert(q, requestData)
    TriggerClientEvent('g5-request:client:add', target, requestData)
end)

local function HandleClientAnswer(src, id, accepted)
    if not id then return false end

    local q = ensureQueue(src)
    local foundIndex = nil
    for i, r in ipairs(q) do
        if tostring(r.id) == tostring(id) then
            foundIndex = i
            break
        end
    end

    if not foundIndex then
        return false
    end

    local request = table.remove(q, foundIndex)

    if request and request.groupId and pendingGroupRequests[request.groupId] then
        pendingGroupRequests[request.groupId].results[src] = {
            answered = true,
            accepted = accepted == true,
            timedOut = false,
            canceled = false
        }
    end

    if accepted then
        TriggerClientEvent('g5-request:server:accepted_notify', request.from, src, request)
    else
        TriggerClientEvent('g5-request:server:denied_notify', request.from, src, request)
    end

    return true
end

lib.callback.register('g5-request:answer', function(source, id, accepted)
    local ok = HandleClientAnswer(source, id, accepted)
    return ok
end)

AddEventHandler('playerDropped', function()
    local src = source
    playerQueues[src] = nil
end)

lib.callback.register('g5-request:sendAndWait', function(source, targets, requestData, timeoutMs)
    if type(targets) == 'number' then
        targets = { targets }
    end
    if type(targets) ~= 'table' then
        return {}
    end
    requestData = requestData or {}
    return SendRequestAndWait(targets, requestData, timeoutMs)
end)

local function CancelRequest(target, id, cancelledBy)
    if not target or not id then return false end
    local q = playerQueues[target]
    local removedRequest = nil
    if q then
        for i = #q, 1, -1 do
            if tostring(q[i].id) == tostring(id) then
                removedRequest = table.remove(q, i)
                break
            end
        end
    end

    TriggerClientEvent('g5-request:client:remove', target, id)

    if removedRequest and removedRequest.groupId and pendingGroupRequests[removedRequest.groupId] then
        pendingGroupRequests[removedRequest.groupId].results[target] = {
            answered = true,
            accepted = false,
            timedOut = false,
            canceled = true
        }
    end

    return removedRequest ~= nil
end

exports('cancelRequest', CancelRequest)

local function CancelGroup(groupId, cancelledBy)
    if not groupId or not pendingGroupRequests[groupId] then return false end
    local info = pendingGroupRequests[groupId]
    info.canceled = true
    for targetId, q in pairs(playerQueues) do
        for i = #q, 1, -1 do
            local req = q[i]
            if req and req.groupId == groupId then
                local id = req.id
                table.remove(q, i)
                pendingGroupRequests[groupId].results[targetId] = {
                    answered = false,
                    accepted = false,
                    timedOut = false,
                    canceled = true
                }
                TriggerClientEvent('g5-request:client:remove', targetId, id)
            end
        end
    end
    return true
end

exports('cancelGroup', CancelGroup)

RegisterNetEvent('g5-request:server:cancel', function(target, idOrGroup)
    local src = source
    if type(target) == 'string' and target:match('^group:') then
        local groupId = target:sub(7)
        CancelGroup(groupId, src)
        return
    end

    if type(idOrGroup) == 'string' and idOrGroup:match('^group:') then
        local groupId = idOrGroup:sub(7)
        CancelGroup(groupId, src)
        return
    end

    if tonumber(target) and idOrGroup then
        CancelRequest(tonumber(target), idOrGroup, src)
    end
end)

lib.addCommand('sendtestrequest', {
    help = 'Envia um request de teste para o jogador alvo',
    params = {
        {
            name = 'target',
            type = 'playerId',
            help = 'Target player\'s server id',
        },
    },
    restricted = "group.admin"
    }, function(source, args, rawCommand)
    local targetId = tonumber(args.target)
    if not targetId then
        print('Usage: sendtestrequest <targetServerId>')
        return
    end
    local requestData = {
        title = 'Teste de Request',
        titleIcon = 'user',
        titleIconColor = '#0000FF',
        tag = 'TESTE',
        code = '1234',
        extras = {
            {
                icon = 'user',
                name = 'Informação',
                value = 'Este é um request de teste enviado via comando.'
            },
            {
                icon = 'clock',
                name = 'Duração',
                value = '15 segundos'
            },
            {
                icon = 'map-marker',
                name = 'Localização',
                value = 'Cidade Central'
            }
        },
        timeout = 150000,
        tagColor = '#FF0000',
        progressColor = '#00FF00',
        codeColor = '#FFF',
        sound = 'mixkit-interface-option-select-2573'
    }
    TriggerEvent('g5-request:server:send', targetId, requestData)
end)

lib.addCommand('sendgrouptest', {
    help = 'Envia um request de teste para múltiplos jogadores e aguarda respostas',
    params = {
        {
            name = 'targets',
            type = 'string',
            help = 'Lista de server ids separados por vírgula (ex: 2,3)'
        },
    },
    restricted = "group.admin"
}, function(source, args, rawCommand)
    local targetsArg = args.targets or ''
    local targets = {}
    for part in string.gmatch(targetsArg, '([^,]+)') do
        local s = part:match("^%s*(.-)%s*$") or part -- trim
        local n = tonumber(s)
        if n then table.insert(targets, n) end
    end

    if #targets == 0 then
        print('Uso: /sendgrouptest <id1,id2,...>')
        return
    end

    local requestData = {
        title = 'Teste de Grupo',
        titleIcon = 'users',
        titleIconColor = '#00AACC',
        tag = 'GRUPO',
        code = 'GRP' .. tostring(math.random(1000,9999)),
        extras = {
            { icon = 'info', name = 'Nota', value = 'Request de grupo - teste' }
        },
        timeout = 20000,
        tagColor = '#FFAA00',
        progressColor = '#00FF88',
        codeColor = '#FFFFFF',
        sound = 'mixkit-doorbell-tone-2864'
    }

    local results = SendRequestAndWait(targets, requestData, requestData.timeout)

    print('[g5-request] Resultados do sendgrouptest:')
    for pid, res in pairs(results) do
        print(('[g5-request] Player %s => answered=%s accepted=%s timedOut=%s'):format(
            tostring(pid),
            tostring(res.answered),
            tostring(res.accepted),
            tostring(res.timedOut)
        ))
    end
end)

lib.addCommand('cancelrequest', {
    help = 'Cancela um request enviado para um jogador (unitário)',
    params = {
        { name = 'target', type = 'playerId', help = 'Target player\'s server id' },
        { name = 'id', type = 'string', help = 'Request id a ser cancelado' },
    },
    restricted = "group.admin"
}, function(source, args, rawCommand)
    local targetId = tonumber(args.target)
    local reqId = args.id

    if not targetId or not reqId or reqId == '' then
        print('Uso: /cancelrequest <targetServerId> <requestId>')
        return
    end

    local ok = CancelRequest(targetId, reqId, source)
    if ok then
        print(('[g5-request] Request %s cancelado para player %s'):format(reqId, tostring(targetId)))
    else
        print(('[g5-request] Request %s não encontrado para player %s'):format(reqId, tostring(targetId)))
    end
end)
