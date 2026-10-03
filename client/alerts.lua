-- client/alerts.lua
-- Automatic (game-event driven) alerts. Each handler is a thin trigger over the
-- generic TriggerAlert engine (client/dispatch.lua) so no dispatch payload is
-- built by hand here.

local timer = {}
-- Framework access via the lazy bridge (client/framework.lua) — no hard core dep.
local resourceName = GetCurrentResourceName()

-- Cooldown gate to prevent spam (per alert type, keyed by Config.DefaultAlerts)
local function WaitTimer(name, action, ...)
    if not Config.DefaultAlerts[name] then return end

    if not timer[name] then
        timer[name] = true
        action(...)
        SetTimeout(Config.DefaultAlertsDelay * 1000, function()
            timer[name] = false
        end)
    end
end

local function IsWeaponWhitelisted(weapon)
    if not Config.WeaponWhitelist then return false end
    for _, hash in ipairs(Config.WeaponWhitelist) do
        if weapon == GetHashKey(hash) then
            return true
        end
    end
    return false
end

-- Shocking-event handlers receive the list of peds that actually perceived the
-- event as their first argument. Only alert when the acting ped was witnessed.
local function IsPedAWitness(witnesses, ped)
    for _, v in pairs(witnesses) do
        if v == ped then return true end
    end
    return false
end

-- Manual panic button (10-78)
local function Panic()
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local street = GetStreetAndZone(coords)

    PhoneAnimation()

    exports[resourceName]:createDispatch({
        title = locale('panic_title'),
        titleIcon = "skull",
        code = "10-78",
        tag = "PANIC",
        groups = { 'leo' },
        priority = 1,
        x = coords.x,
        y = coords.y,
        blipSprite = 161,
        blipColor = 75,
        blipScale = 2.0,
        blipFlash = true,
        sound = "panicbutton",
        extras = {
            { icon = "skull", name = locale('field_situation'), value = locale('panic_situation') },
            { icon = "location-dot", name = locale('field_location'), value = street },
            { icon = "id-badge", name = locale('field_unit'), value = LocalPlayer.state.callsign or locale('unknown') }
        }
    })

    lib.notify({ title = 'Dispatch', description = locale('panic_triggered'), type = 'error' })
end

RegisterCommand("panic", Panic, false)
RegisterCommand("10-78", Panic, false)

-- Shooting
AddEventHandler('CEventGunShot', function(witnesses, ped)
    if ped ~= PlayerPedId() then return end
    if IsPedCurrentWeaponSilenced(ped) then return end
    if inNoDispatchZone then return end -- e.g. inside Ammunation
    if IsWeaponWhitelisted(GetSelectedPedWeapon(ped)) then return end

    WaitTimer('Shooting', function()
        -- Reroute gunfire inside a hunting zone to a low-priority 'hunting' alert.
        if inHuntingZone then
            TriggerAlert('hunting')
            return
        end
        -- Only alert if someone actually witnessed the shot.
        if witnesses and not IsPedAWitness(witnesses, ped) then return end
        TriggerAlert('shooting')
    end)
end)

-- Vehicle theft (car alarm)
AddEventHandler('CEventShockingCarAlarm', function(_, ped)
    if ped ~= PlayerPedId() then return end

    WaitTimer('Autotheft', function()
        local vehicle = GetVehiclePedIsUsing(ped, true)
        if vehicle and vehicle ~= 0 then
            TriggerAlert('vehicletheft', { vehicle = vehicle })
        end
    end)
end)

-- Vehicle theft (carjacking fallback loop)
CreateThread(function()
    while true do
        Wait(1000)
        local ped = PlayerPedId()
        if IsPedJacking(ped) then
            WaitTimer('Autotheft', function()
                local vehicle = GetVehiclePedIsUsing(ped, true)
                if vehicle and vehicle ~= 0 then
                    TriggerAlert('carjack', { vehicle = vehicle })
                end
            end)
        end
    end
end)

-- Speeding
CreateThread(function()
    while true do
        Wait(2000)
        if Config.DefaultAlerts.Speeding then
            local ped = PlayerPedId()
            if IsPedInAnyVehicle(ped, false) then
                local vehicle = GetVehiclePedIsIn(ped, false)
                local speed = GetEntitySpeed(vehicle) * 3.6 -- km/h
                local limit = 140 -- ~85 mph

                if speed > limit and GetPedInVehicleSeat(vehicle, -1) == ped then
                    local class = GetVehicleClass(vehicle)
                    if class ~= 15 and class ~= 16 and class ~= 21 then -- Ignore Heli, Plane, Train
                        WaitTimer('Speeding', function()
                            TriggerAlert('speeding', {
                                vehicle = vehicle,
                                extras = { { icon = 'gauge-high', name = locale('field_speed'), value = math.floor(speed) .. ' km/h' } }
                            })
                        end)
                    end
                end
            end
        end
    end
end)

-- Melee / Fight
AddEventHandler('CEventShockingSeenMeleeAction', function(witnesses, ped)
    if ped ~= PlayerPedId() then return end

    WaitTimer('Melee', function()
        if witnesses and not IsPedAWitness(witnesses, ped) then return end
        TriggerAlert('fight')
    end)
end)

-- Explosion
AddEventHandler('explosionEvent', function(sender, ev)
    if sender ~= GetPlayerServerId(PlayerId()) then return end
    if ev.explosionType == 9 then return end -- Ignore gas can

    WaitTimer('Explosion', function()
        TriggerAlert('explosion')
    end)
end)

-- Officer Down (LEO on duty, killed)
AddEventHandler('gameEventTriggered', function(event, data)
    if event ~= "CEventNetworkEntityDamage" then return end
    if not Config.DefaultAlerts.PlayerDowned then return end

    local victim = data[1]
    if victim ~= PlayerPedId() or not IsEntityDead(PlayerPedId()) then return end

    local PlayerData = Framework.PlayerData()
    if not PlayerData then return end
    local job = PlayerData.job and PlayerData.job.name

    local isLeo = false
    if Config.JobMapping['leo'] then
        for _, j in ipairs(Config.JobMapping['leo']) do
            if job == j then isLeo = true break end
        end
    end

    if isLeo and PlayerData.job.onduty then
        WaitTimer('PlayerDowned', function()
            TriggerAlert('officerdown')
        end)
    end
end)
