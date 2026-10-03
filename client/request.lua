-- client/request.lua
local resourceName = GetCurrentResourceName()
local requests = {}

-- Global (read by blips.lua): when true, incoming alerts are ignored entirely.
AlertsDisabled = AlertsDisabled or false

local function GetCallsign()
    local playerData = Framework.PlayerData()
    return LocalPlayer.state.callsign
        or (playerData and playerData.metadata and playerData.metadata.callsign)
        or "UNIT"
end

-- Attach the local player as a responding unit on a dispatch.
local function AttachUnit(dispatchId)
    if not dispatchId then return end
    TriggerServerEvent(resourceName..':server:attachUnit', dispatchId, { callsign = GetCallsign() })
end
exports('AttachUnit', AttachUnit)

-- Detach the local player from a dispatch (leave "en route").
local function DetachUnit(dispatchId)
    if not dispatchId then return end
    TriggerServerEvent(resourceName..':server:detachUnit', dispatchId)
end
exports('DetachUnit', DetachUnit)

local function AcceptRequest(request)
    if not request then return end

    AttachUnit(request.id)

    -- Set Waypoint
    if request.coords or (request.x and request.y) then
        SetNewWaypoint(request.x or request.coords.x, request.y or request.coords.y)
        lib.notify({description = locale('accepted_gps'), type = 'success'})
    end

    -- Optional: Flash UI to indicate interaction
    SendNUIMessage({action = 'flashAccept', id = request.id})
end

RegisterNUICallback('attachUnit', function(data, cb)
    if data and data.id then
        AttachUnit(data.id)
        if data.x and data.y then SetNewWaypoint(data.x, data.y) end
    end
    cb({ok = true})
end)

RegisterNUICallback('detachUnit', function(data, cb)
    if data and data.id then DetachUnit(data.id) end
    cb({ok = true})
end)

RegisterNUICallback('saveCallsign', function(data, cb)
    if data.callsign then
        LocalPlayer.state.callsign = data.callsign
    end
    cb('ok')
end)

local acceptKeybind = lib.addKeybind({
    name = (resourceName..'_req_accept'),
    description = 'Aceitar request',
    defaultKey = Config.AcceptKey or 'Y',
    onReleased = function(self)
        if #requests > 0 then
            local request = requests[#requests]
            if request then
                AcceptRequest(request)
            end
        end
    end
})

local denyKeybind = lib.addKeybind({
    name = (resourceName..'_req_deny'),
    description = 'Recusar request',
    defaultKey = Config.DenyKey or 'N',
    onReleased = function(self)
        if #requests > 0 then
            local id = requests[1].id
            SendNUIMessage({action = 'flashDeny', id = id})
            lib.callback(resourceName..':answer', false, function(_) end, id, false)
            table.remove(requests, 1)
            SendNUIMessage({action = 'remove', id = id})
            UpdateKeybinds()
        end
    end
})

-- Enable the accept/deny keybinds only while there is an active request, so the
-- keys are free for other uses when no dispatch is pending.
function UpdateKeybinds()
    local active = #requests > 0
    acceptKeybind:disable(not active)
    denyKeybind:disable(not active)
end
UpdateKeybinds()

RegisterNetEvent(resourceName..':client:nuiReady', function()
    SendNUIMessage({
        action = 'init',
        acceptKey = acceptKeybind.currentKey or Config.AcceptKey,
        denyKey = denyKeybind.currentKey or Config.DenyKey,
        position = Config.Position or 'top-right',
        locale = GetConvar('ox:locale', 'en'),
        themes = Themes
    })
end)

local function removeRequest(id)
    for i, r in ipairs(requests) do
        if tostring(r.id) == tostring(id) then
            table.remove(requests, i)
            break
        end
    end
end

RegisterNetEvent(resourceName..':client:add', function(requestData)
    if AlertsDisabled then return end -- player toggled alerts off via the menu

    local found = false
    for i, r in ipairs(requests) do
        if tostring(r.id) == tostring(requestData.id) then
           requests[i] = requestData
           found = true
           break
        end
    end

    if not found then
        table.insert(requests, requestData)
        SendNUIMessage({
            action = 'init',
            acceptKey = acceptKeybind.currentKey or Config.AcceptKey,
            denyKey = denyKeybind.currentKey or Config.DenyKey,
            position = Config.Position or 'top-right',
            locale = GetConvar('ox:locale', 'en'),
            themes = Themes
        })
        SendNUIMessage({action = 'add', request = requestData})
        UpdateKeybinds()
    else
         -- It's an update
         SendNUIMessage({action = 'update', request = requestData})
    end
end)

RegisterNetEvent(resourceName..':client:update', function(requestData)
    -- Explicit update event from server
    for i, r in ipairs(requests) do
        if tostring(r.id) == tostring(requestData.id) then
           requests[i] = requestData
           break
        end
    end
    SendNUIMessage({action = 'update', request = requestData})
end)

RegisterNetEvent(resourceName..':client:remove', function(id)
    if not id then return end
    removeRequest(id)
    SendNUIMessage({ action = 'remove', id = id })
    UpdateKeybinds()
end)

RegisterNetEvent(resourceName..':client:prolong', function(id, params)
    if not id then return end
    SendNUIMessage({
        action = 'prolong',
        id = id,
        set = params and params.set or nil
    })
end)

RegisterNUICallback('answer', function(data, cb)
    local id = data.id
    local accepted = data.accepted
    if not id then
        cb({ok = false})
        return
    end

    local foundRequest = nil
    for i, r in ipairs(requests) do
        if tostring(r.id) == tostring(id) then
            foundRequest = r
            if not accepted then
                 table.remove(requests, i) -- If denied, remove locally
            end
            break
        end
    end

    if accepted and foundRequest then
        AcceptRequest(foundRequest)
    else
        lib.callback(resourceName..':answer', false, function(res)
             -- callback logic if needed
        end, id, accepted)
    end

    UpdateKeybinds()
    cb({ok = true})
end)

-- Rodada 4 — dispatch menu controls --------------------------------------

-- Stop / resume receiving alerts entirely (blips + cards + sound).
RegisterNUICallback('toggleAlerts', function(_, cb)
    AlertsDisabled = not AlertsDisabled
    alertsMuted = AlertsDisabled -- global from blips.lua: also silence sounds
    lib.notify({
        description = AlertsDisabled and locale('alerts_disabled') or locale('alerts_enabled'),
        type = AlertsDisabled and 'error' or 'success'
    })
    cb({ disabled = AlertsDisabled })
end)

-- Wipe all active dispatch blips from the map.
RegisterNUICallback('clearBlips', function(_, cb)
    TriggerEvent(resourceName..':client:clearBlips')
    cb({ ok = true })
end)

-- Re-pull the active call list from the server and repopulate the UI.
RegisterNUICallback('refreshAlerts', function(_, cb)
    if AlertsDisabled then cb({ ok = false }) return end
    lib.callback(resourceName..':callback:getCalls', false, function(calls)
        if not calls then return end
        for _, call in ipairs(calls) do
            TriggerEvent(resourceName..':client:add', call)
        end
    end)
    cb({ ok = true })
end)
