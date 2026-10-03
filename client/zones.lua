-- client/zones.lua
-- Contextual suppression / reroute zones (Rodada 3).
--   * NoDispatchZones — automatic alerts are suppressed while inside (e.g. Ammunation).
--   * HuntingZones    — gunshots reroute to a 'hunting' alert instead of 'shooting'.
-- Both flags are globals read by client/alerts.lua.
inHuntingZone = false
inNoDispatchZone = false

CreateThread(function()
    -- Config is a shared_script; wait until it is populated.
    while not Config or not Config.Locations do Wait(100) end
    -- Wait for the admin overlay to be applied so zones register with the
    -- effective (post-overlay) coords. Falls through after ~5s if the callback
    -- never resolves, using whatever Config.Locations currently holds.
    local deadline = GetGameTimer() + 5000
    while not ConfigOverlayApplied and GetGameTimer() < deadline do Wait(50) end

    -- Hunting Zones (sphere) ------------------------------------------------
    for _, hunting in pairs(Config.Locations.HuntingZones or {}) do
        if Config.EnableHuntingBlip then
            local blip = AddBlipForCoord(hunting.coords.x, hunting.coords.y, hunting.coords.z)
            local radiusBlip = AddBlipForRadius(hunting.coords.x, hunting.coords.y, hunting.coords.z, hunting.radius)
            SetBlipSprite(blip, 442)
            SetBlipAsShortRange(blip, true)
            SetBlipScale(blip, 0.8)
            SetBlipColour(blip, 0)
            SetBlipColour(radiusBlip, 0)
            SetBlipAlpha(radiusBlip, 40)
            BeginTextCommandSetBlipName('STRING')
            AddTextComponentString(hunting.label or 'Hunting Zone')
            EndTextCommandSetBlipName(blip)
        end

        lib.zones.sphere({
            coords = hunting.coords,
            radius = hunting.radius,
            debug = Config.Debug,
            onEnter = function() inHuntingZone = true end,
            onExit = function() inHuntingZone = false end,
        })
    end

    -- No Dispatch Zones (box) ----------------------------------------------
    for _, nd in pairs(Config.Locations.NoDispatchZones or {}) do
        lib.zones.box({
            coords = nd.coords,
            size = vec3(nd.length or 2.0, nd.width or 2.0, (nd.maxZ or 0.0) - (nd.minZ or 0.0)),
            rotation = nd.heading or 0.0,
            debug = Config.Debug,
            onEnter = function() inNoDispatchZone = true end,
            onExit = function() inNoDispatchZone = false end,
        })
    end
end)
