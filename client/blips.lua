-- client/blips.lua
-- Draws dispatch blips: main blip, optional radius blip with alpha fade,
-- optional position offset, and the alert sound.
local blips = {}
local radiusBlips = {}
local resourceName = GetCurrentResourceName()

-- Flipped by the NUI 'toggleAlerts' callback (Rodada 4) to silence sounds.
alertsMuted = alertsMuted or false

local function randomOffset(base, max)
    return base + math.random(-max, max)
end

--- Play the alert sound.
--- Frontend GTA sounds (those carrying a soundset in `sound2`, e.g. 'Lose_1st')
--- go through the native PlaySound. Custom .ogg cues (dispatch / panicbutton /
--- robberysound) route through interact-sound when it is running; otherwise we
--- fall back to a known-valid native cue so the alert is never fully silent.
local function playAlertSound(b)
    if alertsMuted then return end
    local sound = b.sound
    if not sound then return end

    if b.sound2 then
        PlaySound(-1, sound, b.sound2, 0, 0, 1)
    elseif GetResourceState('interact-sound') == 'started' then
        TriggerServerEvent('InteractSound_SV:PlayOnSource', sound, 0.25)
    else
        PlaySound(-1, 'Lose_1st', 'GTAO_FM_Events_Soundset', 0, 0, 1)
    end
end

RegisterNetEvent(resourceName .. ':client:add', function(requestData)
    if AlertsDisabled then return end -- alerts toggled off via the menu
    if not requestData or not requestData.blip then return end
    local b = requestData.blip

    local x, y = requestData.x, requestData.y
    -- If no coords in root, try extras (legacy support)
    if (not x or not y) and requestData.extras and requestData.extras.x and requestData.extras.y then
        x, y = requestData.extras.x, requestData.extras.y
    end
    if not x or not y then return end
    local z = b.z or requestData.z or 0.0

    local id = requestData.id

    -- Remove existing (update path)
    if blips[id] then RemoveBlip(blips[id]); blips[id] = nil end
    if radiusBlips[id] then RemoveBlip(radiusBlips[id]); radiusBlips[id] = nil end

    -- Optional random offset to obscure the exact position
    if b.offset then
        local max = Config.MaxOffset or 120
        x = randomOffset(x, max)
        y = randomOffset(y, max)
    end

    -- Main blip
    local blip = AddBlipForCoord(x, y, z)
    SetBlipSprite(blip, b.sprite or 161)
    SetBlipColour(blip, b.color or 1)
    SetBlipScale(blip, b.scale or 1.0)
    SetBlipAsShortRange(blip, true)
    SetBlipHighDetail(blip, true)
    if b.flash then SetBlipFlashes(blip, true) end

    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString(b.label or "Dispatch")
    EndTextCommandSetBlipName(blip)

    blips[id] = blip

    -- Optional radius blip
    local radius = tonumber(b.radius) or 0
    local radiusBlip
    if radius > 0 then
        radiusBlip = AddBlipForRadius(x, y, z, radius + 0.0)
        SetBlipColour(radiusBlip, b.color or 1)
        SetBlipAlpha(radiusBlip, 128)
        radiusBlips[id] = radiusBlip
    end

    playAlertSound(b)

    -- Lifetime: prefer `length` minutes (ps-dispatch parity), else `time` ms.
    local lifeMs = (b.length and b.length * 60000) or b.time or (Config.DefaultTimeout or 15000)

    CreateThread(function()
        if radiusBlip then
            -- Fade the radius blip from 128 -> 0 across its lifetime.
            local alpha = 128
            local step = math.max(1, math.floor(lifeMs / alpha))
            while alpha > 0 and DoesBlipExist(radiusBlip) do
                Wait(step)
                alpha = alpha - 1
                SetBlipAlpha(radiusBlip, alpha)
            end
            if radiusBlips[id] then RemoveBlip(radiusBlips[id]); radiusBlips[id] = nil end
        else
            Wait(lifeMs)
        end
        if blips[id] then RemoveBlip(blips[id]); blips[id] = nil end
    end)
end)

RegisterNetEvent(resourceName .. ':client:remove', function(id)
    if blips[id] then RemoveBlip(blips[id]); blips[id] = nil end
    if radiusBlips[id] then RemoveBlip(radiusBlips[id]); radiusBlips[id] = nil end
end)

-- Wipe every active dispatch blip (NUI 'clearBlips' control).
RegisterNetEvent(resourceName .. ':client:clearBlips', function()
    for id, b in pairs(blips) do RemoveBlip(b); blips[id] = nil end
    for id, b in pairs(radiusBlips) do RemoveBlip(b); radiusBlips[id] = nil end
end)
