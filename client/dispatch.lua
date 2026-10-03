local resourceName = GetCurrentResourceName()

local function GetDispatchData()
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local streetName, crossing = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local street = GetStreetNameFromHashKey(streetName)
    if crossing then
        street = street .. " / " .. GetStreetNameFromHashKey(crossing)
    end

    local data = {
        coords = coords,
        street = street,
        zone = GetLabelText(GetNameOfZone(coords.x, coords.y, coords.z))
    }

    if IsPedInAnyVehicle(playerPed, false) then
        local vehicle = GetVehiclePedIsIn(playerPed, false)
        local primary, secondary = GetVehicleColours(vehicle)

        data.vehicle = {
            model = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle)),
            plate = GetVehicleNumberPlateText(vehicle),
            primaryColor = primary,
            secondaryColor = secondary,
            useVehicleInfo = true -- Flag for UI to know it should parse this
        }

        -- Try to get class name (can be enhanced with specific framework logic if needed)
        local classId = GetVehicleClass(vehicle)
        data.vehicle.class = GetLabelText("VEH_CLASS_" .. classId)
    end

    return data
end

exports('getDispatchData', GetDispatchData)

exports('createDispatch', function(data)
    if not data then return end

    local dispatchInfo = GetDispatchData()

    -- Merge auto-gathered info with passed data
    -- Defaults from GetDispatchData can be overridden by passed data
    data.extras = data.extras or {}

    if not data.extras.Location then
        data.extras.Location = dispatchInfo.street
    end

    if dispatchInfo.vehicle and not data.vehicle then
        data.vehicle = {
            model = dispatchInfo.vehicle.model,
            plate = dispatchInfo.vehicle.plate,
            color = dispatchInfo.vehicle.primaryColor, -- Simplification for UI
            class = dispatchInfo.vehicle.class
        }
    end

    -- Add coordinates if not present
    if not data.x and not data.y then
        data.x = dispatchInfo.coords.x
        data.y = dispatchInfo.coords.y
    end
    if not data.z then
        data.z = (data.coords and data.coords.z) or dispatchInfo.coords.z
    end

    -- Default Blip Settings
    if not data.blip then
        data.blip = {
            sprite = data.blipSprite or 161, -- Default: Radar circle
            color = data.blipColor or 1, -- Default: Red
            scale = data.blipScale or 1.0,
            time = data.blipTime or (data.timeout or 15000), -- Match timeout or default
            flash = data.blipFlash or false,
            label = data.title or "Dispatch",
            z = data.z,
            radius = data.blipRadius or 0, -- AddBlipForRadius size (0 = none)
            offset = data.blipOffset or false, -- Randomize position to hide exact spot
            length = data.blipLength, -- Lifetime in minutes (ps-dispatch parity)
            sound = data.sound, -- Alert sound cue
            sound2 = data.sound2, -- GTA soundset for frontend sounds
        }
    end

    TriggerServerEvent(('%s:server:createDispatch'):format(resourceName), data)
end)

--- Generic, data-driven alert dispatcher.
--- Builds a dispatch from a Config.Alerts template so individual alert types
--- (see client/exports.lua and client/alerts.lua) don't duplicate boilerplate.
--- @param name string          Key into Config.Alerts (also the default blip key)
--- @param opts table|nil       Optional overrides: { vehicle = entity, camId, coords, priority, groups, extras = {..} }
function TriggerAlert(name, opts)
    opts = opts or {}
    local def = (Config.Alerts and Config.Alerts[name]) or {}

    local ped = PlayerPedId()
    local coords = opts.coords or GetEntityCoords(ped)
    local street = GetStreetAndZone(coords)

    -- Gather optional context based on the template flags
    local vehicleData
    if def.vehicle or opts.vehicle then
        local veh = opts.vehicle
        if not veh or veh == 0 then
            veh = IsPedInAnyVehicle(ped, false) and GetVehiclePedIsIn(ped, false) or nil
        end
        if veh and veh ~= 0 then vehicleData = GetVehicleData(veh) end
    end

    local callsign = LocalPlayer.state.callsign

    -- Localized display strings (Rodada 5)
    local title = opts.title or locale('alert_' .. name)
    local tag = def.tag and locale('tag_' .. def.tag) or def.code

    -- Assemble UI extras
    local extras = {
        { icon = def.icon or 'circle-info', name = locale('field_situation'), value = title },
        { icon = 'location-dot', name = locale('field_location'), value = street },
    }
    if def.gender then
        extras[#extras + 1] = { icon = 'venus-mars', name = locale('field_gender'), value = GetPlayerGender() }
    end
    if def.weapon then
        extras[#extras + 1] = { icon = 'gun', name = locale('field_weapon'), value = GetWeaponName() }
    end
    if vehicleData then
        extras[#extras + 1] = { icon = 'car', name = locale('field_vehicle'), value = ('%s (%s)'):format(vehicleData.name, vehicleData.plate) }
        extras[#extras + 1] = { icon = 'palette', name = locale('field_color'), value = vehicleData.color }
    end
    if def.unit then
        extras[#extras + 1] = { icon = 'id-badge', name = locale('field_unit'), value = callsign or locale('unknown') }
    end
    if opts.extras then
        for _, e in ipairs(opts.extras) do extras[#extras + 1] = e end
    end

    local blipConf = (Config.Blips and Config.Blips[def.blip or name]) or {}

    exports[resourceName]:createDispatch({
        title = title,
        titleIcon = def.icon or opts.icon,
        code = def.code or opts.code,
        tag = tag,
        groups = opts.groups or def.groups,
        priority = opts.priority or def.priority or 2,
        alertTime = opts.alertTime or def.alertTime,
        x = coords.x,
        y = coords.y,
        z = coords.z,
        coords = coords,
        camId = opts.camId,
        blipSprite = blipConf.sprite,
        blipColor = blipConf.color,
        blipScale = blipConf.scale,
        blipFlash = blipConf.flash,
        blipRadius = blipConf.radius,
        blipOffset = blipConf.offset,
        blipLength = blipConf.length,
        sound = blipConf.sound,
        sound2 = blipConf.sound2,
        vehicle = vehicleData,
        extras = extras,
    })
end

-- Public generic export: exports['ps-dispatch']:DispatchAlert('storerobbery', { camId = 3 })
exports('DispatchAlert', TriggerAlert)

RegisterNetEvent(resourceName..':client:sendEmergencyMsg', function(message, type, anonymous)
    -- Gate the call: non-empty message, not handcuffed, and (if required) a phone.
    if not IsCallAllowed(message) then return end

    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local street = GetStreetAndZone(coords)
    local gender = GetPlayerGender()

    local title = type == "911" and locale('call_911') or locale('call_311')
    if anonymous then title = title .. " (" .. locale('anonymous') .. ")" end

    exports[resourceName]:createDispatch({
        title = title,
        titleIcon = "phone",
        code = type,
        tag = type,
        recipient = type == "311" and 'ems' or 'leo',
        priority = 3,
        x = coords.x,
        y = coords.y,
        blipSprite = 66,
        blipColor = type == "911" and 1 or 5,
        blipScale = 1.0,
        extras = {
            { icon = "phone", name = locale('field_service'), value = type },
            { icon = "user", name = locale('field_caller'), value = anonymous and locale('anonymous') or (LocalPlayer.state.callsign or locale('unknown')) },
            { icon = "venus-mars", name = locale('field_gender'), value = gender },
            { icon = "location-dot", name = locale('field_location'), value = street },
            { icon = "comment", name = locale('field_message'), value = message }
        }
    })

    lib.notify({title = title, description = locale('msg_sent'), type = 'success'})
end)
