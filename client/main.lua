local requests = {}

local acceptKeybind = lib.addKeybind({
    name = 'g5_req_accept',
    description = 'Aceitar request',
    defaultKey = Config.AcceptKey or 'Y',
    onReleased = function(self)
        if #requests > 0 then
            local id = requests[1].id
            SendNUIMessage({action = 'flashAccept', id = id})
            lib.callback('g5-request:answer', false, function(_) end, id, true)
            table.remove(requests, 1)
            SendNUIMessage({action = 'remove', id = id})
        end
    end
})

local denyKeybind = lib.addKeybind({
    name = 'g5_req_deny',
    description = 'Recusar request',
    defaultKey = Config.DenyKey or 'N',
    onReleased = function(self)
        if #requests > 0 then
            local id = requests[1].id
            SendNUIMessage({action = 'flashDeny', id = id})
            lib.callback('g5-request:answer', false, function(_) end, id, false)
            table.remove(requests, 1)
            SendNUIMessage({action = 'remove', id = id})
        end
    end
})

local function removeRequest(id)
    for i, r in ipairs(requests) do
        if tostring(r.id) == tostring(id) then
            table.remove(requests, i)
            break
        end
    end
end

RegisterNetEvent('g5-request:client:add', function(requestData)
    table.insert(requests, requestData)
    SendNUIMessage({
        action = 'init',
        acceptKey = acceptKeybind.currentKey or Config.AcceptKey,
        denyKey = denyKeybind.currentKey or Config.DenyKey,
        position = Config.Position or 'top-right'
    })
    SendNUIMessage({action = 'add', request = requestData})
end)

RegisterNetEvent('g5-request:client:remove', function(id)
    if not id then return end
    removeRequest(id)
    SendNUIMessage({ action = 'remove', id = id })
end)

RegisterNetEvent('g5-request:client:prolong', function(id, params)
    if not id then return end
    SendNUIMessage({
        action = 'prolong',
        id = id,
        set = params and params.set or nil
    })
end)

RegisterNUICallback('g5_request_answer', function(data, cb)
    local id = data.id
    local accepted = data.accepted
    if not id then
        cb({ok = false})
        return
    end

    for i, r in ipairs(requests) do
        if tostring(r.id) == tostring(id) then
            table.remove(requests, i)
            break
        end
    end

    lib.callback('g5-request:answer', id, accepted, function(res)
        cb({ok = true})
    end)
end)

RegisterNUICallback('g5_nui_ready', function(_, cb)
    SendNUIMessage({
        action = 'init',
        acceptKey = acceptKeybind.currentKey or Config.AcceptKey,
        denyKey = denyKeybind.currentKey or Config.DenyKey,
        position = Config.Position or 'top-right'
    })
    cb({ok = true})
end)
