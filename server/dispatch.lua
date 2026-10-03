local resourceName = GetCurrentResourceName()
local calls = {}
local callCount = 0

local function GetPlayersWithJob(jobs)
    -- Normalize jobs to array
    if type(jobs) == 'string' then jobs = {jobs} end
    local players = {}

    -- Attempt basic framework detection
    -- QBCore
    if GetResourceState('qb-core') == 'started' then
        local QBCore = exports['qb-core']:GetCoreObject()
        for _, src in ipairs(GetPlayers()) do
            local Player = QBCore.Functions.GetPlayer(tonumber(src))
            if Player then
                for _, job in ipairs(jobs) do
                    if Player.PlayerData.job.name == job then
                         -- Handle OnDuty check? g5-request uses it.
                         if Config.OnDutyOnly then
                             if Player.PlayerData.job.onduty then
                                 table.insert(players, tonumber(src))
                             end
                         else
                             table.insert(players, tonumber(src))
                         end
                         break
                    end
                end
            end
        end
    -- ESX
    elseif GetResourceState('es_extended') == 'started' then
        local ESX = exports['es_extended']:getSharedObject()
        for _, src in ipairs(GetPlayers()) do
            local xPlayer = ESX.GetPlayerFromId(tonumber(src))
            if xPlayer then
                for _, job in ipairs(jobs) do
                     if xPlayer.job.name == job then
                         -- ESX has no built-in duty flag; honor job.onDuty when a
                         -- duty resource populates it, otherwise treat as on duty.
                         if Config.OnDutyOnly and xPlayer.job.onDuty ~= nil then
                             if xPlayer.job.onDuty then
                                 table.insert(players, tonumber(src))
                             end
                         else
                             table.insert(players, tonumber(src))
                         end
                         break
                     end
                end
            end
        end
    else
        -- Fallback: Send to everyone (dev mode or standalone)
        -- Or return empty if strict
        return GetPlayers()
    end

    return players
end

exports('GetDispatchCalls', function()
    return calls
end)

local function findCall(id)
    for _, c in ipairs(calls) do
        if c.id == id then return c end
    end
    return nil
end

-- Resolve which player sources should receive a dispatch.
--   data.recipient : single mapping-group key (e.g. 'leo')
--   data.groups    : list of mapping-group keys (e.g. { 'leo', 'ems' })
--   data.jobs      : list of direct job names (bypasses Config.JobMapping)
-- Falls back to everyone (-1) when no filter is provided.
local function ResolveRecipients(data)
    if data.recipient and Config.JobMapping[data.recipient] then
        return GetPlayersWithJob(Config.JobMapping[data.recipient])
    end

    if data.groups then
        local seen, out = {}, {}
        for _, group in ipairs(data.groups) do
            local mapped = Config.JobMapping[group]
            if mapped then
                for _, src in ipairs(GetPlayersWithJob(mapped)) do
                    if not seen[src] then
                        seen[src] = true
                        out[#out + 1] = src
                    end
                end
            end
        end
        return out
    end

    if data.jobs then
        return GetPlayersWithJob(data.jobs)
    end

    return { -1 }
end

-- Unified Event Handler
local function HandleDispatch(data)
    callCount = callCount + 1
    data.id = tostring(callCount) -- Keep ID as string for UI consistency
    data.time = os.time() * 1000
    data.units = {}
    data.responses = {}

    if #calls >= Config.MaxCallList then
        table.remove(calls, 1)
    end

    calls[#calls + 1] = data

    -- Broadcast to filtered players
    for _, target in ipairs(ResolveRecipients(data)) do
        TriggerClientEvent(resourceName..':client:add', target, data)
    end
end

RegisterNetEvent(resourceName..':server:createDispatch', HandleDispatch)
RegisterNetEvent(resourceName..':server:notify', HandleDispatch) -- Alias for compatibility

-- Callbacks
lib.callback.register(resourceName..':callback:getLatestDispatch', function(source)
    return calls[#calls]
end)

lib.callback.register(resourceName..':callback:getCalls', function(source)
    return calls
end)

-- Commands
lib.addCommand('dispatch', {
    help = 'Open Dispatch Menu'
}, function(source, raw)
    TriggerClientEvent(resourceName..':client:openMenu', source)
end)

lib.addCommand('911', {
    help = 'Send a message to 911',
    params = { { name = 'message', type = 'string', help = '911 Message' }},
}, function(source, args, raw)
    local fullMessage = raw:sub(5)
    TriggerClientEvent(resourceName..':client:sendEmergencyMsg', source, fullMessage, "911", false)
end)

lib.addCommand('911a', {
    help = 'Send an anonymous message to 911',
    params = { { name = 'message', type = 'string', help = '911 Message' }},
}, function(source, args, raw)
    local fullMessage = raw:sub(5)
    TriggerClientEvent(resourceName..':client:sendEmergencyMsg', source, fullMessage, "911", true)
end)

lib.addCommand('311', {
    help = 'Send a message to 311',
    params = { { name = 'message', type = 'string', help = '311 Message' }},
}, function(source, args, raw)
    local fullMessage = raw:sub(5)
    TriggerClientEvent(resourceName..':client:sendEmergencyMsg', source, fullMessage, "311", false)
end)

lib.addCommand('311a', {
    help = 'Send an anonymous message to 311',
    params = { { name = 'message', type = 'string', help = '311 Message' }},
}, function(source, args, raw)
    local fullMessage = raw:sub(5)
    TriggerClientEvent(resourceName..':client:sendEmergencyMsg', source, fullMessage, "311", true)
end)

-- Responder tracking -------------------------------------------------------

local function AttachUnit(src, dispatchId, unitData)
    local dispatch = findCall(dispatchId)
    if not dispatch then return end

    -- Add unit if not already attached (dedupe by source)
    for _, u in ipairs(dispatch.units) do
        if u.source == src then return end
    end

    table.insert(dispatch.units, {
        source = src,
        callsign = (unitData and unitData.callsign) or "UNIT"
    })
    TriggerClientEvent(resourceName..':client:update', -1, dispatch)
end

local function DetachUnit(src, dispatchId)
    local dispatch = findCall(dispatchId)
    if not dispatch then return end

    for i, u in ipairs(dispatch.units) do
        if u.source == src then
            table.remove(dispatch.units, i)
            TriggerClientEvent(resourceName..':client:update', -1, dispatch)
            return
        end
    end
end

RegisterNetEvent(resourceName..':server:attachUnit', function(dispatchId, unitData)
    AttachUnit(source, dispatchId, unitData)
end)

RegisterNetEvent(resourceName..':server:detachUnit', function(dispatchId)
    DetachUnit(source, dispatchId)
end)

-- ps-dispatch compatibility ------------------------------------------------
-- Accept the raw ps-dispatch:server:notify payload (flat fields + nested
-- `alert` table + `jobs` groups) and reshape it into our dispatch schema.

local function stripFa(icon)
    if not icon or icon == '' then return nil end
    icon = icon:gsub('fa[a-z%-]* ', '')
    icon = icon:gsub('fa%-', '')
    return icon
end

local function truthy(v)
    return v ~= nil and v ~= false and v ~= 'false' and v ~= '0' and v ~= 0
end

local function translatePsDispatch(d)
    d = d or {}
    local coords = d.coords or {}
    local alert = d.alert or {}

    local extras = {
        { icon = stripFa(d.icon) or 'circle-info', name = locale('field_situation'), value = d.message or locale('incident') },
    }
    if d.street then extras[#extras + 1] = { icon = 'location-dot', name = locale('field_location'), value = d.street } end
    if d.gender then extras[#extras + 1] = { icon = 'venus-mars', name = locale('field_gender'), value = d.gender } end
    if d.weapon then extras[#extras + 1] = { icon = 'gun', name = locale('field_weapon'), value = d.weapon } end
    if d.vehicle then extras[#extras + 1] = { icon = 'car', name = locale('field_vehicle'), value = d.plate and ('%s (%s)'):format(d.vehicle, d.plate) or d.vehicle } end
    if d.color then extras[#extras + 1] = { icon = 'palette', name = locale('field_color'), value = d.color } end
    if d.name then extras[#extras + 1] = { icon = 'user', name = locale('field_name'), value = d.name } end
    if d.callsign then extras[#extras + 1] = { icon = 'id-badge', name = locale('field_callsign'), value = d.callsign } end
    if d.number then extras[#extras + 1] = { icon = 'phone', name = locale('field_number'), value = d.number } end
    if d.information then extras[#extras + 1] = { icon = 'comment', name = locale('field_message'), value = d.information } end

    return {
        title = d.message or locale('incident'),
        titleIcon = stripFa(d.icon),
        code = d.code,
        tag = d.codeName and string.upper(tostring(d.codeName)) or nil,
        priority = d.priority or 2,
        alertTime = d.alertTime,
        groups = d.jobs or { 'leo' },
        x = coords.x,
        y = coords.y,
        coords = coords,
        camId = d.camId,
        blipSprite = alert.sprite,
        blipColor = alert.color,
        blipScale = alert.scale,
        blipFlash = truthy(alert.flash),
        sound = alert.sound,
        vehicle = d.vehicle and { model = d.vehicle, plate = d.plate, color = d.color, class = d.class } or nil,
        extras = extras,
    }
end

RegisterNetEvent('ps-dispatch:server:notify', function(data)
    HandleDispatch(translatePsDispatch(data))
end)

RegisterNetEvent('ps-dispatch:server:attach', function(dispatchId)
    AttachUnit(source, dispatchId, nil)
end)

RegisterNetEvent('ps-dispatch:server:detach', function(dispatchId)
    DetachUnit(source, dispatchId)
end)
