local playerQueues = {}
local pendingGroupRequests = {}

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

local function TryQueueRequest(target, requestData)
    if not tonumber(target) then return { added = false, reason = 'invalid_target' } end
    local tid = tonumber(target)
    local q = ensureQueue(tid)

    for _, existing in ipairs(q) do
        if existing and (
            (requestData.id and tostring(existing.id) == tostring(requestData.id)) or
            (requestData.from and existing.from and tostring(existing.from) == tostring(requestData.from)
                and requestData.code and existing.code and tostring(existing.code) == tostring(requestData.code)
                and (not requestData.tag or tostring(existing.tag) == tostring(requestData.tag))
            )
        ) then
            if requestData.prolong then
                existing.timeout = requestData.timeout or 15000
                TriggerClientEvent('g5-request:client:prolong', tid, existing.id, { set = existing.timeout })
            end
            return { added = false, reason = 'duplicate', existing = existing }
        end
    end

    table.insert(q, requestData)
    TriggerClientEvent('g5-request:client:add', tid, requestData)
    return { added = true }
end

local function SendRequestAndWait(targets, requestData, timeoutMs, cb)
    if type(targets) == 'number' then
        targets = { targets }
    end
    if type(targets) ~= 'table' then
        return {}
    end
    timeoutMs = timeoutMs or (Config and Config.DefaultTimeout) or 15000

    local groupId = tostring(os.time()) .. tostring(math.random(1000,9999))
    pendingGroupRequests[groupId] = {
        results = {},
        created = GetGameTimer(),
        canceled = false,
        pendingTargets = {} -- nova tabela para alvos que já tinham request duplicado
    }

    for _, targetId in ipairs(targets) do
        if tonumber(targetId) then
            local rd = shallowCopy(requestData or {})
            rd.groupId = groupId
            rd.id = rd.id or (tostring(os.time()) .. tostring(math.random(1000,9999)))
            rd.timeout = rd.timeout or timeoutMs

            local res = TryQueueRequest(tonumber(targetId), rd)
            if res.added then
                TriggerEvent('g5-request:server:send', tonumber(targetId), rd)
            else
                -- NÃO marcar como "resultado recebido" aqui.
                -- Em vez disso registre como pendingTarget para que não finalize a espera.
                pendingGroupRequests[groupId].pendingTargets[tonumber(targetId)] = true
            end
        end
    end

    local waitUntil = GetGameTimer() + timeoutMs
    while GetGameTimer() < waitUntil do
        local allReceived = true
        for _, targetId in ipairs(targets) do
            local tid = tonumber(targetId)
            if pendingGroupRequests[groupId].results[tid] == nil then
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
            if pendingGroupRequests[groupId].pendingTargets and pendingGroupRequests[groupId].pendingTargets[tid] then
                results[tid] = { answered = false, accepted = false, timedOut = false, canceled = false, pending = true }
            else
                if pendingGroupRequests[groupId].canceled then
                    results[tid] = { answered = false, accepted = false, timedOut = false, canceled = true, pending = false }
                else
                    results[tid] = { answered = false, accepted = false, timedOut = true, canceled = false, pending = false }
                end
            end
        else
            results[tid] = {
                answered = entry.answered == true,
                accepted = entry.accepted == true,
                timedOut = entry.timedOut == true,
                canceled = entry.canceled == true,
                pending = entry.pending == true
            }
        end
    end

    pendingGroupRequests[groupId] = nil
    if cb then cb(results) return end
    return results
end

exports('sendAndWait', SendRequestAndWait)

RegisterNetEvent('g5-request:server:send', function(target, requestData)
    local src = source
    if not target or not requestData then return end
    requestData.id = requestData.id or (tostring(os.time()) .. tostring(math.random(1000,9999)))
    requestData.from = requestData.from or src
    requestData.timeout = requestData.timeout or 15000

    local try = TryQueueRequest(target, requestData)
    if not try.added then
        local origin = requestData.from or src
        if origin and tonumber(origin) and tonumber(origin) > 0 then
            TriggerClientEvent('g5-request:server:duplicate_notify', tonumber(origin), tonumber(target), requestData, try.existing and try.existing.id or nil)
        else
            TriggerEvent('g5-request:server:send:duplicate', target, requestData, try.existing)
        end
        return
    end
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

local function GetRequestStatus(target, idOrMatcher)
    if not target then return nil end
    local q = playerQueues[target] or {}
    if not idOrMatcher then
        local list = {}
        for _, r in ipairs(q) do
            table.insert(list, {
                id = r.id,
                from = r.from,
                code = r.code,
                tag = r.tag,
                timeout = r.timeout,
                groupId = r.groupId
            })
        end
        return { found = (#list > 0), queue = list }
    end

    for _, r in ipairs(q) do
        if tostring(r.id) == tostring(idOrMatcher) then
            return { found = true, inQueue = true, request = shallowCopy(r) }
        end
    end

    if type(idOrMatcher) == 'table' then
        for _, r in ipairs(q) do
            local ok = true
            if idOrMatcher.from and tostring(r.from) ~= tostring(idOrMatcher.from) then ok = false end
            if idOrMatcher.code and tostring(r.code) ~= tostring(idOrMatcher.code) then ok = false end
            if idOrMatcher.tag and tostring(r.tag) ~= tostring(idOrMatcher.tag) then ok = false end
            if ok then
                return { found = true, inQueue = true, request = shallowCopy(r) }
            end
        end
    end

    return { found = false }
end

exports('getRequestStatus', GetRequestStatus)

local function GetGroupStatus(groupId)
    if not groupId then return nil end
    local info = pendingGroupRequests[groupId]
    if not info then return nil end
    local resultsCopy = {}
    for k, v in pairs(info.results or {}) do resultsCopy[k] = shallowCopy(v) end
    local pendingCopy = {}
    if info.pendingTargets then
        for k, v in pairs(info.pendingTargets) do pendingCopy[k] = v end
    end
    return {
        created = info.created,
        canceled = info.canceled,
        results = resultsCopy,
        pendingTargets = pendingCopy
    }
end

exports('getGroupStatus', GetGroupStatus)

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
        acceptText = 'Aceitar',
        denyText = 'Recusar',
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

lib.addCommand('testthemes', {
    help = 'Envia requests de teste com todos os temas predefinidos (ambulancia, police, bombeiro, recrutamento, default)',
    params = {
        {
            name = 'target',
            type = 'playerId',
            help = 'ID do jogador alvo',
        },
    },
    restricted = "group.admin"
}, function(source, args, rawCommand)
    local targetId = tonumber(args.target)
    if not targetId then
        print('Uso: /testthemes <targetServerId>')
        return
    end

    -- Define os temas a serem testados com suas respectivas configurações
    local themesTest = {
        {
            name = 'ambulancia',
            themeType = 'ambulancia',
            title = 'Chamado Médico',
            titleIcon = 'ambulance',
            tag = 'AMBULÂNCIA',
            code = 'A-' .. tostring(math.random(100, 999)),
            extras = {
                { icon = 'map-marker', name = 'Local', value = 'Hospital Central' },
                { icon = 'heartbeat', name = 'Urgência', value = 'Alta' },
                { icon = 'user', name = 'Paciente', value = 'Civil ferido' }
            },
            sound = 'mixkit-doorbell-tone-2864'
        },
        {
            name = 'police',
            themeType = 'police',
            title = 'Ocorrência Policial',
            titleIcon = 'shield',
            tag = 'POLÍCIA',
            code = 'P-' .. tostring(math.random(100, 999)),
            extras = {
                { icon = 'map-marker', name = 'Local', value = 'Delegacia Central' },
                { icon = 'exclamation-triangle', name = 'Tipo', value = 'Assalto em Progresso' },
                { icon = 'clock', name = 'Prioridade', value = 'Urgente' }
            },
            sound = 'mixkit-sci-fi-click-900'
        },
        {
            name = 'bombeiro',
            themeType = 'bombeiro',
            title = 'Emergência Bombeiros',
            titleIcon = 'fire',
            tag = 'BOMBEIRO',
            code = 'B-' .. tostring(math.random(100, 999)),
            extras = {
                { icon = 'map-marker', name = 'Local', value = 'Prédio Downtown' },
                { icon = 'fire', name = 'Situação', value = 'Incêndio Grande Porte' },
                { icon = 'exclamation', name = 'Risco', value = 'Alto' }
            },
            sound = 'mixkit-gaming-lock-2848'
        },
        {
            name = 'recrutamento',
            themeType = 'recrutamento',
            title = 'Convite de Recrutamento',
            titleIcon = 'users',
            tag = 'RECRUTAMENTO',
            code = 'R-' .. tostring(math.random(100, 999)),
            extras = {
                { icon = 'building', name = 'Organização', value = 'G5 Corporation' },
                { icon = 'star', name = 'Cargo', value = 'Recruta Nível I' },
                { icon = 'money', name = 'Benefícios', value = 'Salário + Bonus' }
            },
            sound = 'mixkit-confirmation-tone-2867'
        },
        {
            name = 'default',
            themeType = 'default',
            title = 'Solicitação Geral',
            titleIcon = 'info-circle',
            tag = 'GERAL',
            code = 'G-' .. tostring(math.random(100, 999)),
            extras = {
                { icon = 'info-circle', name = 'Tipo', value = 'Informação Padrão' },
                { icon = 'user', name = 'Remetente', value = 'Sistema' },
                { icon = 'clock', name = 'Tempo', value = '15 segundos' }
            },
            sound = 'mixkit-interface-option-select-2573'
        }
    }

    print('[g5-request] Enviando ' .. #themesTest .. ' requests de teste com temas para player ' .. tostring(targetId))

    -- Envia cada request com um delay entre eles
    CreateThread(function()
        for i, themeData in ipairs(themesTest) do
            local requestData = {
                title = themeData.title,
                titleIcon = themeData.titleIcon,
                tag = themeData.tag,
                code = themeData.code,
                themeType = themeData.themeType,
                extras = themeData.extras,
                timeout = 18000, -- 18 segundos
                acceptText = 'Aceitar',
                denyText = 'Recusar',
                sound = themeData.sound
            }

            TriggerEvent('g5-request:server:send', targetId, requestData)
            print('[g5-request] Enviado tema: ' .. themeData.name .. ' (' .. i .. '/' .. #themesTest .. ')')

            -- Delay de 1.5 segundos entre cada request para não sobrecarregar
            if i < #themesTest then
                Wait(1500)
            end
        end

        print('[g5-request] Todos os temas foram enviados para player ' .. tostring(targetId))
    end)
end)

lib.callback.register('g5-request:getRequestStatus', function(source, target, idOrMatcher)
    if type(target) == 'string' and tonumber(target) then target = tonumber(target) end
    return GetRequestStatus(target, idOrMatcher)
end)

lib.callback.register('g5-request:getGroupStatus', function(source, groupId)
    return GetGroupStatus(groupId)
end)
