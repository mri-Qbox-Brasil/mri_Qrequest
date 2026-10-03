-- client/framework.lua
-- Framework bridge (Rodada 6): abstracts qb-core / es_extended so the client
-- never hard-depends on a single core. Previously every client file called
-- `exports['qb-core']:GetCoreObject()` at parse time, which throws (and takes
-- the whole resource down) on an ESX-only server. Every accessor here is LAZY —
-- it resolves the core the first time it is *called*, at runtime — so this
-- file's load order relative to its callers is irrelevant.

Framework = Framework or {}

local coreName -- 'qb' | 'esx' | nil (standalone / unknown)
local coreObj

local function resolve()
    if coreObj then return coreObj end
    if GetResourceState('qb-core') == 'started' then
        coreName = 'qb'
        coreObj = exports['qb-core']:GetCoreObject()
    elseif GetResourceState('es_extended') == 'started' then
        coreName = 'esx'
        coreObj = exports['es_extended']:getSharedObject()
    end
    return coreObj
end

-- Returns 'qb', 'esx', or nil.
function Framework.Name()
    resolve()
    return coreName
end

-- Normalized player-data table (shape still differs per core; use the typed
-- accessors below when the shape matters).
function Framework.PlayerData()
    resolve()
    if coreName == 'qb' then
        return coreObj.Functions.GetPlayerData()
    elseif coreName == 'esx' then
        return coreObj.GetPlayerData()
    end
    return nil
end

-- 1 = female, 0 = male (matches QBCore charinfo.gender).
function Framework.Gender()
    local pd = Framework.PlayerData()
    if not pd then return 0 end
    if coreName == 'qb' then
        return pd.charinfo and pd.charinfo.gender or 0
    elseif coreName == 'esx' then
        local sex = pd.sex
        if sex == 1 or sex == '1' or sex == 'f' or sex == 'F' then return 1 end
        return 0
    end
    return 0
end

-- QBCore tracks handcuff state in metadata; ESX has no universal flag, so we
-- fall back to the entity-config native (covers the ESX cuff resources that
-- flip CONFIG_FLAG 292) and otherwise return false.
function Framework.IsHandcuffed()
    if coreName == 'qb' then
        local pd = Framework.PlayerData()
        return (pd and pd.metadata and pd.metadata.ishandcuffed) or false
    end
    return GetPedConfigFlag(PlayerPedId(), 292, true)
end

-- Whether the player counts as "on duty". QBCore has job.onduty; ESX has no
-- built-in duty concept, so we honor job.onDuty when a duty resource populates
-- it and otherwise treat everyone as on duty (fail-open).
function Framework.IsOnDuty()
    local pd = Framework.PlayerData()
    if not pd or not pd.job then return true end
    if coreName == 'qb' then
        return pd.job.onduty
    elseif coreName == 'esx' then
        if pd.job.onDuty ~= nil then return pd.job.onDuty end
        return true
    end
    return true
end

function Framework.JobName()
    local pd = Framework.PlayerData()
    return pd and pd.job and pd.job.name
end

-- True if the player holds any of `items`. Prefers ox_inventory (core-agnostic)
-- when present; falls back to QBCore's HasItem. ESX without ox_inventory has no
-- reliable synchronous client item API, so we fail-open (don't block the call).
function Framework.HasItem(items)
    if not items or #items == 0 then return true end
    resolve()
    if GetResourceState('ox_inventory') == 'started' then
        for _, item in ipairs(items) do
            if (exports.ox_inventory:Search('count', item) or 0) > 0 then return true end
        end
        return false
    end
    if coreName == 'qb' then
        for _, item in ipairs(items) do
            if coreObj.Functions.HasItem(item) then return true end
        end
        return false
    end
    return true
end

function Framework.Notify(message, nType, time)
    resolve()
    if coreName == 'qb' then
        coreObj.Functions.Notify(message, nType or 'primary', time or 5000)
    elseif coreName == 'esx' then
        coreObj.ShowNotification(message)
    else
        lib.notify({ description = message, type = (nType == 'error') and 'error' or 'inform' })
    end
end
