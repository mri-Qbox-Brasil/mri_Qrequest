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
        created = GetGameTimer()
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
        local val = pendingGroupRequests[groupId].results[tid]
        if val == nil then
            results[tid] = { answered = false, accepted = false, timedOut = true }
        else
            results[tid] = { answered = true, accepted = val, timedOut = false }
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
    requestData.timeout = requestData.timeout or 8000

    local q = ensureQueue(target)
    table.insert(q, requestData)
    TriggerClientEvent('g5-request:client:add', target, requestData)
end)

RegisterNetEvent('g5-request:server:answer', function(id, accepted)
    local src = source
    if not id then return end

    local q = ensureQueue(src)
    local foundIndex = nil
    for i, r in ipairs(q) do
        if tostring(r.id) == tostring(id) then
            foundIndex = i
            break
        end
    end

    if not foundIndex then
        return
    end

    local request = table.remove(q, foundIndex)

    -- Registra resposta em pendingGroupRequests se for um request de grupo
    if request and request.groupId and pendingGroupRequests[request.groupId] then
        pendingGroupRequests[request.groupId].results[src] = accepted
    end

    if accepted then
        TriggerClientEvent('g5-request:server:accepted_notify', request.from, src, request)
    else
        TriggerClientEvent('g5-request:server:denied_notify', request.from, src, request)
    end
end)

AddEventHandler('playerDropped', function()
    local src = source
    playerQueues[src] = nil
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
        timeout = 15000,
        tagColor = '#FF0000',
        progressColor = '#00FF00',
        codeColor = '#FFF',
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
