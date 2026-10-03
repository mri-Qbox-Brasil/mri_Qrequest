print('^2[g5-request] Loading Config...^7')
Config = {}

-- i18n (Rodada 5): load the locale set selected by the `ox:locale` convar
-- (defaults to 'en'; set `setr ox:locale "pt-br"` on the server). Makes the
-- global `locale('key', ...)` available in every state that loads this shared file.
lib.locale()

-- Keybinds
Config.OpenSettingsKey = 'F3'
Config.OpenDispatchMenu = 'F2'
Config.AcceptKey = 'Y'
Config.DenyKey = 'N'

-- Existing Config
Config.Position = 'top-right'
Config.DefaultTimeout = 15000

Config.ShortCalls = false
Config.Debug = false
Config.RespondKeybind = 'Y'
Config.AlertTime = 5
Config.MaxCallList = 25
Config.OnDutyOnly = true

-- Gating for the 911/311 flow (Rodada 6)
Config.PhoneRequired = true         -- require a phone item to send a 911/311 message
Config.PhoneItems = { 'phone' }     -- any of these items satisfies PhoneRequired

-- Job Configuration
Config.JobMapping = {
    ['leo'] = {'police', 'sheriff', 'trooper'},
    ['ems'] = {'ambulance', 'medic'},
    ['mechanic'] = {'mechanic'}
}

Config.DefaultAlertsDelay = 5
Config.DefaultAlerts = {
    Speeding = true,
    Shooting = true,
    Autotheft = true,
    Melee = true,
    PlayerDowned = true,
    Explosion = true
}

Config.MinOffset = 1
Config.MaxOffset = 120

-- Contextual zones (Rodada 3) --------------------------------------------
-- HuntingZones: gunshots inside reroute to a 'hunting' alert (not 'shooting').
-- NoDispatchZones: automatic alerts are suppressed inside (e.g. Ammunation).
Config.EnableHuntingBlip = false

Config.Locations = {
    ['HuntingZones'] = {
        { label = 'Hunting Zone', radius = 650.0, coords = vector3(-938.61, 4823.99, 313.92) },
    },
    ['NoDispatchZones'] = {
        { label = 'Ammunation 1', coords = vector3(13.53, -1097.92, 29.8),   length = 14.0, width = 5.0, heading = 70,  minZ = 28.8,  maxZ = 32.8 },
        { label = 'Ammunation 2', coords = vector3(821.96, -2163.09, 29.62), length = 14.0, width = 5.0, heading = 270, minZ = 28.62, maxZ = 32.62 },
    },
}

-- Weapon Whitelist
Config.WeaponWhitelist = {
    'WEAPON_GRENADE', 'WEAPON_BZGAS', 'WEAPON_MOLOTOV', 'WEAPON_STICKYBOMB',
    'WEAPON_PROXMINE', 'WEAPON_SNOWBALL', 'WEAPON_PIPEBOMB', 'WEAPON_BALL',
    'WEAPON_SMOKEGRENADE', 'WEAPON_FLARE', 'WEAPON_PETROLCAN',
    'WEAPON_FIREEXTINGUISHER', 'WEAPON_HAZARDCAN', 'WEAPON_RAYCARBINE', 'WEAPON_STUNGUN'
}

-- Blip Configuration (keyed by alert codeName — see Config.Alerts)
Config.Blips = {
    ['shooting']           = { radius = 0,     sprite = 110, color = 1,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['vehicleshots']       = { radius = 0,     sprite = 119, color = 1,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['vehicletheft']       = { radius = 0,     sprite = 595, color = 60, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['carjack']            = { radius = 0,     sprite = 595, color = 60, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['carboosting']        = { radius = 0,     sprite = 595, color = 60, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['speeding']           = { radius = 0,     sprite = 326, color = 84, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['fight']              = { radius = 0,     sprite = 685, color = 69, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['drugdealing']        = { radius = 0,     sprite = 469, color = 20, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['suspicioushandoff']  = { radius = 120.0, sprite = 469, color = 52, scale = 0.0, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = true,  flash = false },
    ['susactivity']        = { radius = 0,     sprite = 66,  color = 37, scale = 0.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['hunting']            = { radius = 0,     sprite = 141, color = 2,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['signrobbery']        = { radius = 0,     sprite = 358, color = 60, scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['explosion']          = { radius = 75.0,  sprite = 436, color = 1,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = true,  flash = false },
    ['civdown']            = { radius = 0,     sprite = 126, color = 3,  scale = 1.5, length = 2, sound = 'dispatch',                                        offset = false, flash = false },
    ['civdead']            = { radius = 0,     sprite = 126, color = 3,  scale = 1.5, length = 2, sound = 'dispatch',                                        offset = false, flash = false },
    ['officerdown']        = { radius = 15.0,  sprite = 526, color = 1,  scale = 1.5, length = 2, sound = 'panicbutton',                                     offset = false, flash = true  },
    ['officerbackup']      = { radius = 15.0,  sprite = 526, color = 1,  scale = 1.5, length = 2, sound = 'panicbutton',                                     offset = false, flash = true  },
    ['officerdistress']    = { radius = 15.0,  sprite = 526, color = 1,  scale = 1.5, length = 2, sound = 'panicbutton',                                     offset = false, flash = true  },
    ['emsdown']            = { radius = 15.0,  sprite = 526, color = 3,  scale = 1.5, length = 2, sound = 'panicbutton',                                     offset = false, flash = false },
    ['storerobbery']       = { radius = 0,     sprite = 52,  color = 1,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['bankrobbery']        = { radius = 0,     sprite = 500, color = 2,  scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['paletobankrobbery']  = { radius = 0,     sprite = 500, color = 12, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['pacificbankrobbery'] = { radius = 0,     sprite = 500, color = 5,  scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['vangelicorobbery']   = { radius = 0,     sprite = 434, color = 5,  scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['houserobbery']       = { radius = 0,     sprite = 40,  color = 5,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['prisonbreak']        = { radius = 0,     sprite = 189, color = 59, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['yachtheist']         = { radius = 0,     sprite = 455, color = 60, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['artgalleryrobbery']  = { radius = 0,     sprite = 269, color = 59, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['humanelabsrobbery']  = { radius = 0,     sprite = 499, color = 1,  scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['trainrobbery']       = { radius = 0,     sprite = 667, color = 78, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['vanrobbery']         = { radius = 0,     sprite = 67,  color = 59, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['undergroundrobbery'] = { radius = 0,     sprite = 486, color = 59, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['drugboatrobbery']    = { radius = 0,     sprite = 427, color = 26, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['unionrobbery']       = { radius = 0,     sprite = 500, color = 60, scale = 1.5, length = 2, sound = 'robberysound',                                    offset = false, flash = false },
    ['911call']            = { radius = 0,     sprite = 480, color = 1,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
    ['311call']            = { radius = 0,     sprite = 480, color = 3,  scale = 1.5, length = 2, sound = 'Lose_1st',     sound2 = 'GTAO_FM_Events_Soundset', offset = false, flash = false },
}

-- Alert Registry (data-driven).
-- Each entry is a template consumed by the generic dispatcher (client/dispatch.lua -> TriggerAlert).
-- Titles are resolved at trigger time from locale keys `alert_<name>` (see locales/*.json);
-- `tag` is a category key resolved from `tag_<key>`. Rodada 5: no display literals here.
-- Fields:
--   code     : 10-code displayed before the title
--   icon     : FontAwesome short name (rendered as `fa fa-<icon>`)
--   priority : 1 = high (red), 2 = default, 3 = low
--   groups   : recipient groups resolved through Config.JobMapping
--   tag      : category key -> locale `tag_<key>` (defaults to the code when omitted)
--   vehicle  : true -> auto-gather & attach the player's current vehicle
--   gender   : true -> include the player's gender
--   weapon   : true -> include the player's current weapon
--   unit     : true -> include the reporting unit's callsign
--   alertTime: override on-screen duration (seconds)
Config.Alerts = {
    -- Automatic (event-driven) alerts
    ['shooting']           = { code = '10-71', icon = 'crosshairs',  priority = 2, groups = { 'leo' }, tag = 'tiros',    gender = true, weapon = true },
    ['vehicleshots']       = { code = '10-60', icon = 'gun',         priority = 2, groups = { 'leo' }, tag = 'tiros',    vehicle = true, weapon = true },
    ['vehicletheft']       = { code = '10-60', icon = 'car',         priority = 2, groups = { 'leo' }, tag = 'roubo',    vehicle = true },
    ['carjack']            = { code = '10-35', icon = 'car',         priority = 2, groups = { 'leo' }, tag = 'roubo',    vehicle = true },
    ['carboosting']        = { code = '10-50', icon = 'car',         priority = 2, groups = { 'leo' }, tag = 'roubo',    vehicle = true },
    ['speeding']           = { code = '10-94', icon = 'gauge-high',  priority = 2, groups = { 'leo' }, tag = 'transito', vehicle = true },
    ['fight']              = { code = '10-10', icon = 'hand-fist',   priority = 2, groups = { 'leo' }, tag = 'briga',    gender = true },
    ['explosion']          = { code = '10-80', icon = 'fire',        priority = 1, groups = { 'leo' }, tag = 'explosao' },
    ['officerdown']        = { code = '10-13', icon = 'skull',       priority = 1, groups = { 'leo', 'ems' }, tag = 'urgente', unit = true, alertTime = 10 },

    -- Public/manual alerts (parity with ps-dispatch exports)
    ['hunting']            = { code = '10-13', icon = 'gun',         priority = 2, groups = { 'leo' }, tag = 'caca',     gender = true, weapon = true },
    ['prisonbreak']        = { code = '10-90', icon = 'person-running', priority = 2, groups = { 'leo' }, tag = 'fuga',  gender = true },
    ['storerobbery']       = { code = '10-90', icon = 'store',       priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['bankrobbery']        = { code = '10-90', icon = 'building-columns', priority = 2, groups = { 'leo' }, tag = 'assalto', gender = true },
    ['paletobankrobbery']  = { code = '10-90', icon = 'building-columns', priority = 2, groups = { 'leo' }, tag = 'assalto', gender = true },
    ['pacificbankrobbery'] = { code = '10-90', icon = 'building-columns', priority = 2, groups = { 'leo' }, tag = 'assalto', gender = true },
    ['vangelicorobbery']   = { code = '10-90', icon = 'gem',         priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['houserobbery']       = { code = '10-90', icon = 'house',       priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['yachtheist']         = { code = '10-65', icon = 'sailboat',    priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['artgalleryrobbery']  = { code = '10-90', icon = 'palette',     priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['humanelabsrobbery']  = { code = '10-90', icon = 'flask',       priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['trainrobbery']       = { code = '10-90', icon = 'train',       priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['vanrobbery']         = { code = '10-90', icon = 'van-shuttle', priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['undergroundrobbery'] = { code = '10-90', icon = 'person-digging', priority = 2, groups = { 'leo' }, tag = 'assalto', gender = true },
    ['drugboatrobbery']    = { code = '10-65', icon = 'ship',        priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['unionrobbery']       = { code = '10-90', icon = 'truck-field', priority = 2, groups = { 'leo' }, tag = 'assalto',  gender = true },
    ['signrobbery']        = { code = '10-10', icon = 'signature',   priority = 2, groups = { 'leo' }, tag = 'roubo',    gender = true },
    ['drugdealing']        = { code = '10-90', icon = 'cannabis',    priority = 2, groups = { 'leo' }, tag = 'drogas',   gender = true },
    ['suspicioushandoff']  = { code = '10-13', icon = 'tablets',     priority = 2, groups = { 'leo' }, tag = 'suspeito', gender = true },
    ['susactivity']        = { code = '10-66', icon = 'eye',         priority = 2, groups = { 'leo' }, tag = 'suspeito', gender = true },

    -- EMS / officer alerts
    ['civdown']            = { code = '10-69', icon = 'face-dizzy',  priority = 1, groups = { 'ems' }, tag = 'medico',   gender = true, alertTime = 10 },
    ['civdead']            = { code = '10-69', icon = 'skull',       priority = 1, groups = { 'ems' }, tag = 'medico',   gender = true, alertTime = 10 },
    ['officerbackup']      = { code = '10-32', icon = 'shield-halved', priority = 1, groups = { 'leo', 'ems' }, tag = 'reforco', unit = true, alertTime = 10 },
    ['officerdistress']    = { code = '10-99', icon = 'triangle-exclamation', priority = 1, groups = { 'leo', 'ems' }, tag = 'urgente', unit = true, alertTime = 10 },
    ['emsdown']            = { code = '10-99', icon = 'truck-medical', priority = 1, groups = { 'leo', 'ems' }, tag = 'urgente', unit = true, alertTime = 10 },
}

-- Colors for vehicle data (GTA V color id -> name)
Config.Colors = {
    ['0'] = "Metallic Black", ['1'] = "Metallic Graphite Black", ['2'] = "Metallic Black Steel", ['3'] = "Metallic Dark Silver",
    ['4'] = "Metallic Silver", ['5'] = "Metallic Blue Silver", ['6'] = "Metallic Steel Gray", ['7'] = "Metallic Shadow Silver",
    ['8'] = "Metallic Stone Silver", ['9'] = "Metallic Midnight Silver", ['10'] = "Metallic Gun Metal", ['11'] = "Metallic Anthracite Grey",
    ['12'] = "Matte Black", ['13'] = "Matte Gray", ['14'] = "Matte Light Grey", ['15'] = "Util Black",
    ['16'] = "Util Black Poly", ['17'] = "Util Dark silver", ['18'] = "Util Silver", ['19'] = "Util Gun Metal",
    ['20'] = "Util Shadow Silver", ['21'] = "Worn Black", ['22'] = "Worn Graphite", ['23'] = "Worn Silver Grey",
    ['24'] = "Worn Silver", ['25'] = "Worn Blue Silver", ['26'] = "Worn Shadow Silver", ['27'] = "Metallic Red",
    ['28'] = "Metallic Torino Red", ['29'] = "Metallic Formula Red", ['30'] = "Metallic Blaze Red", ['31'] = "Metallic Graceful Red",
    ['32'] = "Metallic Garnet Red", ['33'] = "Metallic Desert Red", ['34'] = "Metallic Cabernet Red", ['35'] = "Metallic Candy Red",
    ['36'] = "Metallic Sunrise Orange", ['37'] = "Metallic Classic Gold", ['38'] = "Metallic Orange", ['39'] = "Matte Red",
    ['40'] = "Matte Dark Red", ['41'] = "Matte Orange", ['42'] = "Matte Yellow", ['43'] = "Util Red",
    ['44'] = "Util Bright Red", ['45'] = "Util Garnet Red", ['46'] = "Worn Red", ['47'] = "Worn Golden Red",
    ['48'] = "Worn Dark Red", ['49'] = "Metallic Dark Green", ['50'] = "Metallic Racing Green", ['51'] = "Metallic Sea Green",
    ['52'] = "Metallic Olive Green", ['53'] = "Metallic Green", ['54'] = "Metallic Gasoline Blue Green", ['55'] = "Matte Lime Green",
    ['56'] = "Util Dark Green", ['57'] = "Util Green", ['58'] = "Worn Dark Green", ['59'] = "Worn Green",
    ['60'] = "Worn Sea Wash", ['61'] = "Metallic Midnight Blue", ['62'] = "Metallic Dark Blue", ['63'] = "Metallic Saxony Blue",
    ['64'] = "Metallic Blue", ['65'] = "Metallic Mariner Blue", ['66'] = "Metallic Harbor Blue", ['67'] = "Metallic Diamond Blue",
    ['68'] = "Metallic Surf Blue", ['69'] = "Metallic Nautical Blue", ['70'] = "Metallic Bright Blue", ['71'] = "Metallic Purple Blue",
    ['72'] = "Metallic Spinnaker Blue", ['73'] = "Metallic Ultra Blue", ['74'] = "Metallic Bright Blue", ['75'] = "Util Dark Blue",
    ['76'] = "Util Midnight Blue", ['77'] = "Util Blue", ['78'] = "Util Sea Foam Blue", ['79'] = "Uil Lightning blue",
    ['80'] = "Util Maui Blue Poly", ['81'] = "Util Bright Blue", ['82'] = "Matte Dark Blue", ['83'] = "Matte Blue",
    ['84'] = "Matte Midnight Blue", ['85'] = "Worn Dark blue", ['86'] = "Worn Blue", ['87'] = "Worn Light blue",
    ['88'] = "Metallic Taxi Yellow", ['89'] = "Metallic Race Yellow", ['90'] = "Metallic Bronze", ['91'] = "Metallic Yellow Bird",
    ['92'] = "Metallic Lime", ['93'] = "Metallic Champagne", ['94'] = "Metallic Pueblo Beige", ['95'] = "Metallic Dark Ivory",
    ['96'] = "Metallic Choco Brown", ['97'] = "Metallic Golden Brown", ['98'] = "Metallic Light Brown", ['99'] = "Metallic Straw Beige",
    ['100'] = "Metallic Moss Brown", ['101'] = "Metallic Biston Brown", ['102'] = "Metallic Beechwood", ['103'] = "Metallic Dark Beechwood",
    ['104'] = "Metallic Choco Orange", ['105'] = "Metallic Beach Sand", ['106'] = "Metallic Sun Bleeched Sand", ['107'] = "Metallic Cream",
    ['108'] = "Util Brown", ['109'] = "Util Medium Brown", ['110'] = "Util Light Brown", ['111'] = "Metallic White",
    ['112'] = "Metallic Frost White", ['113'] = "Worn Honey Beige", ['114'] = "Worn Brown", ['115'] = "Worn Dark Brown",
    ['116'] = "Worn straw beige", ['117'] = "Brushed Steel", ['118'] = "Brushed Black Steel", ['119'] = "Brushed Aluminium",
    ['120'] = "Chrome", ['121'] = "Worn Off White", ['122'] = "Util Off White", ['123'] = "Worn Orange",
    ['124'] = "Worn Light Orange", ['125'] = "Metallic Securicor Green", ['126'] = "Worn Taxi Yellow", ['127'] = "Police Car Blue",
    ['128'] = "Matte Green", ['129'] = "Matte Brown", ['130'] = "Worn Orange", ['131'] = "Matte White",
    ['132'] = "Worn White", ['133'] = "Worn Olive Army Green", ['134'] = "Pure White", ['135'] = "Hot Pink",
    ['136'] = "Salmon pink", ['137'] = "Metallic Vermillion Pink", ['138'] = "Orange", ['139'] = "Green",
    ['140'] = "Blue", ['141'] = "Mettalic Black Blue", ['142'] = "Metallic Black Purple", ['143'] = "Metallic Black Red",
    ['144'] = "hunter green", ['145'] = "Metallic Purple", ['146'] = "Metallic Dark Blue", ['147'] = "Black",
    ['148'] = "Matte Purple", ['149'] = "Matte Dark Purple", ['150'] = "Metallic Lava Red", ['151'] = "Matte Forest Green",
    ['152'] = "Matte Olive Drab", ['153'] = "Matte Desert Brown", ['154'] = "Matte Desert Tan", ['155'] = "Matte Foilage Green",
    ['156'] = "Default Alloy Color", ['157'] = "Epsilon Blue", ['158'] = "Pure Gold", ['159'] = "Brushed Gold", ['160'] = "MP100"
}

return Config