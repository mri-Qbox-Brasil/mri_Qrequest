-- Aplica o overlay de config (defaults Lua + edicoes do painel admin) no global
-- `Config` client-side, in place. Com isso, todos os consumidores existentes
-- (client/dispatch.lua, client/blips.lua, client/zones.lua, client/alerts.lua)
-- pegam as edicoes sem precisar mudar os pontos de leitura.
--
-- Hidrata no boot via callback e mantem em sync pelo broadcast
-- `<res>:client:configChanged` disparado quando um admin salva pela NUI.

local RES = GetCurrentResourceName()

-- Sinaliza que o snapshot do boot ja foi aplicado. client/zones.lua espera por
-- isso pra registrar as ox_lib zones com as coords efetivas (pos-overlay).
ConfigOverlayApplied = false
-- Ultimo snapshot recebido — client/main.lua reenvia pra NUI ao abrir o admin.
LastAdminSnapshot = nil

-- Coords que passam pela NUI voltam como {x,y,z} (JSON). ox_lib zones e as
-- nativas de blip precisam de vector3 — converte de volta, idempotente pra
-- vector3 que ja veio via msgpack.
local function toVec3(c)
    if type(c) ~= 'table' then return c end
    if c.x ~= nil then return vec3(c.x + 0.0, c.y + 0.0, c.z + 0.0) end
    if c[1] ~= nil then return vec3(c[1] + 0.0, c[2] + 0.0, c[3] + 0.0) end
    return c
end

-- Constrói uma cópia de Locations com coords em vector3 para o Config global
-- (ox_lib zones exigem vector real). NÃO muta o snap original — ele precisa
-- continuar com coords {x,y,z} plain para reenvio à NUI (vector3 quebra o JSON
-- do SendNUIMessage/cb e trava o painel).
local function locationsToVec3(loc)
    if type(loc) ~= 'table' then return loc end
    local out = {}
    for group, list in pairs(loc) do
        if type(list) == 'table' then
            local newList = {}
            for i, entry in pairs(list) do
                if type(entry) == 'table' then
                    local copy = {}
                    for k, v in pairs(entry) do copy[k] = (k == 'coords') and toVec3(v) or v end
                    newList[i] = copy
                else
                    newList[i] = entry
                end
            end
            out[group] = newList
        else
            out[group] = list
        end
    end
    return out
end

-- Aplica um snapshot (mesmo shape do buildSnapshot() no server) no Config.
local function applySnapshot(snap)
    if type(snap) ~= 'table' then return end
    if type(snap.settings) == 'table' then
        for key, value in pairs(snap.settings) do
            Config[key] = value
        end
    end
    if type(snap.DefaultAlerts) == 'table' then Config.DefaultAlerts = snap.DefaultAlerts end
    if type(snap.JobMapping) == 'table' then Config.JobMapping = snap.JobMapping end
    if type(snap.Blips) == 'table' then Config.Blips = snap.Blips end
    if type(snap.Locations) == 'table' then Config.Locations = locationsToVec3(snap.Locations) end
    if type(snap.alerts) == 'table' then Config.Alerts = snap.alerts end
end

CreateThread(function()
    while not Config or not Config.Alerts do Wait(100) end
    local snap = lib.callback.await(RES .. ':server:getAdminConfig', false)
    if snap then
        applySnapshot(snap)
        LastAdminSnapshot = snap
    end
    ConfigOverlayApplied = true
end)

RegisterNetEvent(RES .. ':client:configChanged', function(snap)
    applySnapshot(snap)
    LastAdminSnapshot = snap
    -- Se a NUI admin estiver aberta, empurra o snapshot atualizado.
    SendNUIMessage({ action = 'updateAdminConfig', data = snap })
end)
