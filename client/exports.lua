-- client/exports.lua
-- ps-dispatch compatible public API. Together with `provide "ps-dispatch"`
-- (fxmanifest) this lets any resource that integrates with ps-dispatch call us
-- unchanged, e.g. exports['ps-dispatch']:StoreRobbery(camId).
--
-- Every alert below is a thin wrapper over the generic TriggerAlert engine
-- (client/dispatch.lua) driven by Config.Alerts — no per-alert boilerplate.

local resourceName = GetCurrentResourceName()

-- Alerts taking no arguments -> exportName = Config.Alerts key
local simpleAlerts = {
    VehicleTheft       = 'vehicletheft',
    Shooting           = 'shooting',
    Hunting            = 'hunting',
    VehicleShooting    = 'vehicleshots',
    SpeedingVehicle    = 'speeding',
    Fight              = 'fight',
    PrisonBreak        = 'prisonbreak',
    DrugDealing        = 'drugdealing',
    DrugSale           = 'suspicioushandoff',
    SuspiciousActivity = 'susactivity',
    HouseRobbery       = 'houserobbery',
    YachtHeist         = 'yachtheist',
    SignRobbery        = 'signrobbery',
    ArtGalleryRobbery  = 'artgalleryrobbery',
    HumaneRobbery      = 'humanelabsrobbery',
    TrainRobbery       = 'trainrobbery',
    VanRobbery         = 'vanrobbery',
    UndergroundRobbery = 'undergroundrobbery',
    DrugBoatRobbery    = 'drugboatrobbery',
    UnionRobbery       = 'unionrobbery',
    InjuriedPerson     = 'civdown',
    DeceasedPerson     = 'civdead',
    OfficerDown        = 'officerdown',
    OfficerBackup      = 'officerbackup',
    OfficerInDistress  = 'officerdistress',
    EmsDown            = 'emsdown',
    Explosion          = 'explosion',
}
for exportName, codeName in pairs(simpleAlerts) do
    exports(exportName, function() TriggerAlert(codeName) end)
end

-- Alerts taking a security camera id (heists) -> passed straight through
local camAlerts = {
    StoreRobbery        = 'storerobbery',
    FleecaBankRobbery   = 'bankrobbery',
    PaletoBankRobbery   = 'paletobankrobbery',
    PacificBankRobbery  = 'pacificbankrobbery',
    VangelicoRobbery    = 'vangelicorobbery',
}
for exportName, codeName in pairs(camAlerts) do
    exports(exportName, function(camId) TriggerAlert(codeName, { camId = camId }) end)
end

-- Alerts taking a vehicle entity handle
exports('CarJacking', function(vehicle) TriggerAlert('carjack', { vehicle = vehicle }) end)
exports('CarBoosting', function(vehicle) TriggerAlert('carboosting', { vehicle = vehicle }) end)

-- Normalize a FontAwesome class string ("fas fa-store", "fa-solid fa-joint")
-- down to the short name our UI expects ("store", "joint").
local function stripFa(icon)
    if not icon or icon == '' then return nil end
    icon = icon:gsub('fa[a-z%-]* ', '') -- drop leading style token (fas / fab / fa-solid ...)
    icon = icon:gsub('fa%-', '')        -- drop the fa- prefix
    return icon
end

-- ps-dispatch uses "false"/false for boolean-ish fields; treat both as false.
local function truthy(v)
    return v ~= nil and v ~= false and v ~= 'false' and v ~= '0' and v ~= 0
end

--- Fully custom alert. Accepts the ps-dispatch CustomAlert schema (flat fields
--- plus an optional nested `alert = { sprite, color, ... }`) and maps it onto
--- our generic dispatch. See ps-dispatch docs for the field list.
local function CustomAlert(data)
    data = data or {}
    local coords = data.coords or GetEntityCoords(PlayerPedId())
    local alert = data.alert or {}

    local extras = {
        { icon = stripFa(data.icon) or 'circle-info', name = locale('field_situation'), value = data.message or locale('incident') },
        { icon = 'location-dot', name = locale('field_location'), value = data.street or GetStreetAndZone(coords) },
    }
    if data.gender then extras[#extras + 1] = { icon = 'venus-mars', name = locale('field_gender'), value = (type(data.gender) == 'string' and data.gender) or GetPlayerGender() } end
    if data.name then extras[#extras + 1] = { icon = 'user', name = locale('field_name'), value = data.name } end
    if data.callsign then extras[#extras + 1] = { icon = 'id-badge', name = locale('field_callsign'), value = data.callsign } end
    if data.model then extras[#extras + 1] = { icon = 'car', name = locale('field_vehicle'), value = data.plate and ('%s (%s)'):format(data.model, data.plate) or data.model } end
    if data.firstColor then extras[#extras + 1] = { icon = 'palette', name = locale('field_color'), value = data.firstColor } end

    exports[resourceName]:createDispatch({
        title = data.message or locale('incident'),
        titleIcon = stripFa(data.icon),
        code = data.code or '10-80',
        tag = data.dispatchCode and string.upper(tostring(data.dispatchCode)) or nil,
        priority = data.priority or 2,
        alertTime = data.alertTime,
        groups = data.job or data.jobs or { 'leo' },
        x = coords.x,
        y = coords.y,
        coords = coords,
        camId = data.camId,
        blipSprite = alert.sprite or data.sprite,
        blipColor = alert.color or data.color,
        blipScale = alert.scale or data.scale,
        blipFlash = truthy(alert.flash or data.flash),
        sound = alert.sound or data.sound,
        extras = extras,
    })
end
exports('CustomAlert', CustomAlert)

-- ps-dispatch client event compatibility (some resources trigger these directly)
RegisterNetEvent('ps-dispatch:client:officerdown', function() TriggerAlert('officerdown') end)
RegisterNetEvent('ps-dispatch:client:officerbackup', function() TriggerAlert('officerbackup') end)
RegisterNetEvent('ps-dispatch:client:emsdown', function() TriggerAlert('emsdown') end)
RegisterNetEvent('ps-dispatch:client:sendEmergencyMsg', function(data, type, anonymous)
    TriggerEvent(resourceName .. ':client:sendEmergencyMsg', data, type, anonymous)
end)
