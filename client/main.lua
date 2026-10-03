-- mri_Qrequest (formerly g5-request)
-- Core initialization and critical commands

local resourceName = GetCurrentResourceName()

-- Helper to wait for config load if necessary
local function WaitForConfig()
    while not Config or not Config.OpenSettingsKey do
        Wait(100)
    end
end

RegisterNUICallback('nuiReady', function(_, cb)
    print(string.format('[%s] NUI ready', resourceName))
    TriggerEvent(resourceName..':client:nuiReady')
    SendNUIMessage({
        action = 'setVisible',
        data = true
    })
    cb({ok = true})
end)

CreateThread(function()
    WaitForConfig()

    RegisterCommand('ui_settings', function()
        -- Toggle Settings
        SetNuiFocus(true, true)
        SendNUIMessage({ action = 'setVisible', data = true })
        SendNUIMessage({ action = 'openSettings' })
    end)
    RegisterKeyMapping('ui_settings', 'Open Settings', 'keyboard', Config.OpenSettingsKey or 'F3')

    RegisterCommand('ui_dispatch', function()
        -- Toggle Dispatch Menu
        SetNuiFocus(true, true)
        SendNUIMessage({ action = 'setVisible', data = true })
        SendNUIMessage({ action = 'openDispatch' })
    end)
    RegisterKeyMapping('ui_dispatch', 'Open Dispatch Menu', 'keyboard', Config.OpenDispatchMenu or 'F2')
end)

RegisterNetEvent(resourceName..':client:openMenu', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'setVisible', data = true })
    SendNUIMessage({ action = 'openDispatch' })
end)

RegisterNUICallback('close', function(_, cb)
    SetNuiFocus(false, false)
    cb({ok = true})
end)

-- ---------------------------------------------------------------------------
-- Painel admin (standalone via comando + callbacks compartilhados com o modo
-- embedded no mri_Qadmin). Os callbacks funcionam nos dois modos porque o
-- iframe do Qadmin aponta para o proprio resource.
-- ---------------------------------------------------------------------------

local function openAdmin()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'setVisible', data = true })
    SendNUIMessage({ action = 'openAdmin', data = LastAdminSnapshot })
end

RegisterCommand('dispatchadmin', openAdmin, false)
RegisterNetEvent(resourceName .. ':client:openAdmin', openAdmin)

RegisterNUICallback('adminClose', function(_, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'closeAdmin' })
    cb({ ok = true })
end)

-- Fetch on-demand (o modo embedded nao passa pelo comando que empurra o
-- snapshot via SendNUIMessage).
RegisterNUICallback('adminGetConfig', function(_, cb)
    local snap = LastAdminSnapshot or lib.callback.await(resourceName .. ':server:getAdminConfig', false)
    LastAdminSnapshot = snap
    cb(snap or {})
end)

RegisterNUICallback('adminSaveConfig', function(payload, cb)
    local ok, result = lib.callback.await(resourceName .. ':server:saveAdminConfig', false, payload)
    if ok and type(result) == 'table' then LastAdminSnapshot = result end
    cb({ success = ok == true, config = ok and result or nil, error = (not ok) and result or nil })
end)

RegisterNUICallback('adminResetConfig', function(_, cb)
    local ok, result = lib.callback.await(resourceName .. ':server:resetAdminConfig', false)
    if ok and type(result) == 'table' then LastAdminSnapshot = result end
    cb({ success = ok == true, config = ok and result or nil, error = (not ok) and result or nil })
end)

RegisterNUICallback('adminGetMyCoords', function(_, cb)
    local coords = GetEntityCoords(PlayerPedId())
    local heading = GetEntityHeading(PlayerPedId())
    cb({ x = coords.x, y = coords.y, z = coords.z, heading = heading })
end)

RegisterCommand("callsign", function(source, args, rawCommand)
    local callsign = args[1]
    if callsign then
        LocalPlayer.state.callsign = callsign
        lib.notify({title = 'Callsign', description = locale('callsign_updated', callsign), type = 'success'})
        SendNUIMessage({
            action = 'updateCallsign',
            callsign = callsign
        })
    else
        lib.notify({title = 'Callsign', description = locale('callsign_usage'), type = 'error'})
    end
end, false)
