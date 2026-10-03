fx_version "cerulean"
game "gta5"
lua54 "yes"
use_experimental_fxv2_oal "yes"

description "Envia requests para outros jogadores."
author "G5 Dev"
version "1.0.0"

ui_page "web/build/index.html"

shared_scripts {
    "@ox_lib/init.lua",
    "shared/config.lua",
    "shared/**/*.lua"
}

server_scripts {
    "server/**/*.lua"
}

client_scripts {
    "client/**/*.lua"
}

dependencies {
    "ox_lib",
}

-- Drop-in replacement for ps-dispatch: satisfies its dependency and
-- routes exports['ps-dispatch']:* / the ps-dispatch:* events to us.
provide "ps-dispatch"

files {
    "web/build/index.html",
    "web/build/**/*",
    "sounds/*.ogg",
    "locales/*.json",
    "data/*.json"
}
