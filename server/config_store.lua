-- Camada de config runtime: overlay JSON sobre os defaults Lua (shared/config.lua).
--
-- Os defaults continuam sendo a fonte de verdade da forma e do comportamento
-- minimo. Este modulo le `data/config.json` (settings gerais + DefaultAlerts +
-- JobMapping + Blips + Locations) e `data/alerts.json` (registro de alertas) e
-- APLICA os overrides direto no global `Config` (in place). Assim todos os
-- pontos de leitura existentes (`Config.Alerts[...]`, `Config.Blips`, etc.)
-- pegam as edicoes sem precisar mudar nada nos consumidores.
--
-- Editavel pela aba admin (NUI): gerais, alertas (CRUD), JobMapping, blips e
-- zonas. Read-only nesta entrega: keybinds e WeaponWhitelist (keybind exige
-- RegisterKeyMapping no boot).
--
-- Sem fallback de codigo proprio: se um JSON sumir/corromper, o overlay daquele
-- arquivo e ignorado e os defaults Lua permanecem intactos.

local CONFIG_FILE = 'data/config.json'
local ALERTS_FILE = 'data/alerts.json'
local RES = GetCurrentResourceName()

-- Chaves escalares/tabelas simples liberadas para edicao pela aba "Geral".
-- Tudo fora desta lista e ignorado no save (defesa contra payload malicioso
-- sobrescrevendo campos read-only tipo keybinds).
local EDITABLE_SETTINGS = {
    DefaultTimeout = 'number',
    AlertTime = 'number',
    OnDutyOnly = 'boolean',
    PhoneRequired = 'boolean',
    PhoneItems = 'table',
    ShortCalls = 'boolean',
    MaxCallList = 'number',
    DefaultAlertsDelay = 'number',
    MinOffset = 'number',
    MaxOffset = 'number',
    EnableHuntingBlip = 'boolean',
    Position = 'string',
    Debug = 'boolean',
}

local NUMERIC_RANGES = {
    DefaultTimeout = { 1000, 120000 },
    AlertTime = { 1, 120 },
    MaxCallList = { 1, 200 },
    DefaultAlertsDelay = { 0, 120 },
    MinOffset = { 0, 1000 },
    MaxOffset = { 0, 1000 },
}

local VALID_POSITIONS = {
    ['top-right'] = true, ['top-left'] = true,
    ['bottom-right'] = true, ['bottom-left'] = true,
}

-- Perm ACE por secao. Semantica: alterar a secao exige a perm correspondente
-- OU a perm master `<res>.admin` OU `command` (console/god).
local SECTION_PERMS = {
    settings     = RES .. '.config.edit',
    DefaultAlerts= RES .. '.config.edit',
    JobMapping   = RES .. '.config.edit',
    Alerts       = RES .. '.alerts.edit',
    Blips        = RES .. '.zones.edit',
    Locations    = RES .. '.zones.edit',
}

-- ---------------------------------------------------------------------------
-- Persistencia
-- ---------------------------------------------------------------------------

local function readJson(file)
    local raw = LoadResourceFile(RES, file)
    if not raw or raw == '' then return nil end
    local ok, parsed = pcall(json.decode, raw)
    if not ok or type(parsed) ~= 'table' then
        print(('[%s] AVISO: %s corrompido — ignorando overlay.'):format(RES, file))
        return nil
    end
    return parsed
end

local function writeJson(file, tbl)
    local ok = SaveResourceFile(RES, file, json.encode(tbl, { indent = true }), -1)
    if not ok then
        print(('[%s] ERRO: falha ao escrever %s'):format(RES, file))
    end
    return ok
end

-- ---------------------------------------------------------------------------
-- Aplicacao do overlay no Config global (in place)
-- ---------------------------------------------------------------------------

local function applyConfigOverlay(overlay)
    if type(overlay) ~= 'table' then return end
    if type(overlay.settings) == 'table' then
        for key, expected in pairs(EDITABLE_SETTINGS) do
            local v = overlay.settings[key]
            if v ~= nil and type(v) == expected then
                Config[key] = v
            end
        end
    end
    if type(overlay.DefaultAlerts) == 'table' then Config.DefaultAlerts = overlay.DefaultAlerts end
    if type(overlay.JobMapping) == 'table' then Config.JobMapping = overlay.JobMapping end
    if type(overlay.Blips) == 'table' then Config.Blips = overlay.Blips end
    if type(overlay.Locations) == 'table' then Config.Locations = overlay.Locations end
end

local function applyAlertsOverlay(alerts)
    if type(alerts) == 'table' then Config.Alerts = alerts end
end

local function deepCopy(t)
    if type(t) ~= 'table' then return t end
    local out = {}
    for k, v in pairs(t) do out[k] = deepCopy(v) end
    return out
end

-- Snapshot dos defaults Lua ANTES de aplicar qualquer overlay. Usado pelo
-- "Reverter para defaults" (restaura in place, sem restart).
local DEFAULTS = {
    settings = (function()
        local s = {}
        for key in pairs(EDITABLE_SETTINGS) do s[key] = deepCopy(Config[key]) end
        return s
    end)(),
    DefaultAlerts = deepCopy(Config.DefaultAlerts),
    JobMapping    = deepCopy(Config.JobMapping),
    Blips         = deepCopy(Config.Blips),
    Locations     = deepCopy(Config.Locations),
    Alerts        = deepCopy(Config.Alerts),
}

local function loadFromDisk()
    applyConfigOverlay(readJson(CONFIG_FILE))
    applyAlertsOverlay(readJson(ALERTS_FILE))
end

loadFromDisk()

-- ---------------------------------------------------------------------------
-- Snapshot efetivo (defaults + overlay ja aplicados) enviado para a UI
-- ---------------------------------------------------------------------------

local function currentSettings()
    local out = {}
    for key in pairs(EDITABLE_SETTINGS) do out[key] = Config[key] end
    return out
end

-- Converte coords vector3/vector4 (defaults Lua) para tabela {x,y,z}. A NUI
-- recebe JSON e nao entende userdata vector — sem isso o cb() serializa errado
-- e o painel trava carregando.
local function coordsToTable(c)
    local tc = type(c)
    if tc == 'vector3' or tc == 'vector4' or tc == 'vector2' then
        return { x = c.x, y = c.y, z = c.z }
    end
    return c
end

local function normalizeLocations(loc)
    if type(loc) ~= 'table' then return {} end
    local out = {}
    for group, list in pairs(loc) do
        if type(list) == 'table' then
            local newList = {}
            for i, entry in pairs(list) do
                if type(entry) == 'table' then
                    local copy = {}
                    for k, v in pairs(entry) do copy[k] = (k == 'coords') and coordsToTable(v) or v end
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

local function buildSnapshot()
    return {
        settings      = currentSettings(),
        DefaultAlerts = Config.DefaultAlerts or {},
        JobMapping    = Config.JobMapping or {},
        Blips         = Config.Blips or {},
        Locations     = normalizeLocations(Config.Locations),
        alerts        = Config.Alerts or {},
        meta = {
            -- Read-only: exibido como informativo na UI.
            readonly = {
                keybinds = {
                    OpenSettingsKey = Config.OpenSettingsKey,
                    OpenDispatchMenu = Config.OpenDispatchMenu,
                    AcceptKey = Config.AcceptKey,
                    DenyKey = Config.DenyKey,
                },
                weaponWhitelist = Config.WeaponWhitelist or {},
            },
            positions = { 'top-right', 'top-left', 'bottom-right', 'bottom-left' },
            resource = RES,
        },
    }
end

-- Getters globais para outros scripts (leem o efetivo pos-overlay).
function GetRuntimeConfig() return buildSnapshot() end
function GetRuntimeAlerts() return Config.Alerts or {} end

-- ---------------------------------------------------------------------------
-- Deep-equal (deteccao de secao alterada, order-insensitive)
-- ---------------------------------------------------------------------------

local function deepEqual(a, b)
    if a == b then return true end
    if type(a) ~= 'table' or type(b) ~= 'table' then return false end
    for k, v in pairs(a) do
        if not deepEqual(v, b[k]) then return false end
    end
    for k in pairs(b) do
        if a[k] == nil then return false end
    end
    return true
end

-- ---------------------------------------------------------------------------
-- Validacao
-- ---------------------------------------------------------------------------

local HEX_PATTERN = '^#%x%x%x%x%x%x$'

local function validateSettings(settings)
    if type(settings) ~= 'table' then return false, locale('admin_err_invalid_payload') end
    for key, value in pairs(settings) do
        local expected = EDITABLE_SETTINGS[key]
        if not expected then
            -- Ignora chaves desconhecidas silenciosamente (nao persiste).
            settings[key] = nil
        elseif type(value) ~= expected then
            return false, locale('admin_err_bad_field', key)
        elseif NUMERIC_RANGES[key] then
            local range = NUMERIC_RANGES[key]
            if value < range[1] or value > range[2] then
                return false, locale('admin_err_out_of_range', key)
            end
        elseif key == 'Position' and not VALID_POSITIONS[value] then
            return false, locale('admin_err_bad_field', key)
        end
    end
    return true
end

local function validateAlert(name, def)
    if type(name) ~= 'string' or name == '' then return false, locale('admin_err_alert_key') end
    if type(def) ~= 'table' then return false, locale('admin_err_alert_shape', name) end
    if type(def.code) ~= 'string' or def.code == '' then return false, locale('admin_err_alert_code', name) end
    if type(def.icon) ~= 'string' or def.icon == '' then return false, locale('admin_err_alert_icon', name) end
    if type(def.priority) ~= 'number' or def.priority < 1 or def.priority > 3 then
        return false, locale('admin_err_alert_priority', name)
    end
    if type(def.groups) ~= 'table' or #def.groups == 0 then
        return false, locale('admin_err_alert_groups', name)
    end
    if def.tag ~= nil and type(def.tag) ~= 'string' then return false, locale('admin_err_alert_shape', name) end
    for _, flag in ipairs({ 'vehicle', 'gender', 'weapon', 'unit' }) do
        if def[flag] ~= nil and type(def[flag]) ~= 'boolean' then
            return false, locale('admin_err_alert_shape', name)
        end
    end
    if def.alertTime ~= nil and (type(def.alertTime) ~= 'number' or def.alertTime < 1 or def.alertTime > 120) then
        return false, locale('admin_err_alert_shape', name)
    end
    return true
end

local function validateAlerts(alerts)
    if type(alerts) ~= 'table' then return false, locale('admin_err_invalid_payload') end
    for name, def in pairs(alerts) do
        local ok, err = validateAlert(name, def)
        if not ok then return false, err end
    end
    return true
end

local function validateBlips(blips)
    if type(blips) ~= 'table' then return false, locale('admin_err_invalid_payload') end
    for name, b in pairs(blips) do
        if type(b) ~= 'table' then return false, locale('admin_err_blip_shape', name) end
        if type(b.sprite) ~= 'number' or type(b.color) ~= 'number' then
            return false, locale('admin_err_blip_shape', name)
        end
    end
    return true
end

local function validateLocations(loc)
    if type(loc) ~= 'table' then return false, locale('admin_err_invalid_payload') end
    return true
end

-- ---------------------------------------------------------------------------
-- Permissao
-- ---------------------------------------------------------------------------

local function can(source, perm)
    return IsPlayerAceAllowed(source, perm)
        or IsPlayerAceAllowed(source, RES .. '.admin')
        or IsPlayerAceAllowed(source, 'command')
end

-- Retorna a lista de secoes que realmente mudaram vs o Config efetivo atual.
local function changedSections(payload)
    local changed = {}
    if payload.settings and not deepEqual(payload.settings, currentSettings()) then changed.settings = true end
    if payload.DefaultAlerts and not deepEqual(payload.DefaultAlerts, Config.DefaultAlerts or {}) then changed.DefaultAlerts = true end
    if payload.JobMapping and not deepEqual(payload.JobMapping, Config.JobMapping or {}) then changed.JobMapping = true end
    if payload.Blips and not deepEqual(payload.Blips, Config.Blips or {}) then changed.Blips = true end
    -- Compara contra a forma normalizada (coords {x,y,z}) — Config.Locations tem
    -- vector3 nos defaults, o payload da NUI tem tabela; sem normalizar, deepEqual
    -- sempre acusaria "mudou" e exigiria zones.edit em qualquer save.
    if payload.Locations and not deepEqual(payload.Locations, normalizeLocations(Config.Locations)) then changed.Locations = true end
    if payload.alerts and not deepEqual(payload.alerts, Config.Alerts or {}) then changed.Alerts = true end
    return changed
end

-- ---------------------------------------------------------------------------
-- Callbacks
-- ---------------------------------------------------------------------------

lib.callback.register(RES .. ':server:getAdminConfig', function()
    return buildSnapshot()
end)

lib.callback.register(RES .. ':server:saveAdminConfig', function(source, payload)
    if type(payload) ~= 'table' then return false, locale('admin_err_invalid_payload') end

    -- Gate granular: exige a perm de cada secao que mudou.
    local changed = changedSections(payload)
    for section in pairs(changed) do
        if not can(source, SECTION_PERMS[section]) then
            return false, locale('admin_err_no_permission')
        end
    end

    -- Validacao por secao presente no payload.
    if payload.settings then
        local ok, err = validateSettings(payload.settings)
        if not ok then return false, err end
    end
    if payload.alerts then
        local ok, err = validateAlerts(payload.alerts)
        if not ok then return false, err end
    end
    if payload.Blips then
        local ok, err = validateBlips(payload.Blips)
        if not ok then return false, err end
    end
    if payload.Locations then
        local ok, err = validateLocations(payload.Locations)
        if not ok then return false, err end
    end

    -- Persiste: config.json (tudo menos alerts) + alerts.json separado.
    local configOverlay = {
        settings      = payload.settings or currentSettings(),
        DefaultAlerts = payload.DefaultAlerts or Config.DefaultAlerts,
        JobMapping    = payload.JobMapping or Config.JobMapping,
        Blips         = payload.Blips or Config.Blips,
        Locations     = payload.Locations or Config.Locations,
    }
    if not writeJson(CONFIG_FILE, configOverlay) then
        return false, locale('admin_err_save_failed')
    end
    if payload.alerts and not writeJson(ALERTS_FILE, payload.alerts) then
        return false, locale('admin_err_save_failed')
    end

    -- Aplica no Config global do server e faz broadcast pros clients.
    applyConfigOverlay(configOverlay)
    if payload.alerts then applyAlertsOverlay(payload.alerts) end

    TriggerClientEvent(RES .. ':client:configChanged', -1, buildSnapshot())
    return true, buildSnapshot()
end)

-- Reverter para os defaults Lua: apaga os overlays em disco e restaura o
-- Config global a partir do snapshot DEFAULTS (in place, sem restart).
lib.callback.register(RES .. ':server:resetAdminConfig', function(source)
    if not can(source, RES .. '.config.edit') then
        return false, locale('admin_err_no_permission')
    end
    SaveResourceFile(RES, CONFIG_FILE, '', -1)
    SaveResourceFile(RES, ALERTS_FILE, '', -1)

    for key in pairs(EDITABLE_SETTINGS) do Config[key] = deepCopy(DEFAULTS.settings[key]) end
    Config.DefaultAlerts = deepCopy(DEFAULTS.DefaultAlerts)
    Config.JobMapping    = deepCopy(DEFAULTS.JobMapping)
    Config.Blips         = deepCopy(DEFAULTS.Blips)
    Config.Locations     = deepCopy(DEFAULTS.Locations)
    Config.Alerts        = deepCopy(DEFAULTS.Alerts)

    TriggerClientEvent(RES .. ':client:configChanged', -1, buildSnapshot())
    return true, buildSnapshot()
end)

print(('^2[%s] Admin config store pronto (callbacks getAdminConfig/saveAdminConfig/resetAdminConfig registrados).^7'):format(RES))
