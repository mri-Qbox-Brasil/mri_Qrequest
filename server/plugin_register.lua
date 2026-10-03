-- Registra o painel admin do dispatch como plugin do mri_Qadmin via export.
-- Fail-silent (pcall): se o Qadmin nao estiver rodando, o painel continua
-- acessivel via /dispatchadmin standalone. O manifest espelha
-- web/src/plugin/types.ts (drift control manual).
--
-- Esquema de permissoes NOVO (granular via permDefs): o Qadmin registra as
-- perms no editor de grupos e semeia o grupo `god`. O gate server (por secao)
-- vive em server/config_store.lua.

local RES = GetCurrentResourceName()

local function registerPlugin()
    if GetResourceState('mri_Qadmin') ~= 'started' then return end
    local ok, result = pcall(function()
        return exports['mri_Qadmin']:RegisterPlugin({
            id = RES,
            label = 'Dispatch',
            icon = 'radio',
            resource = RES,
            -- htmlPath omitido: default do Qadmin ja e 'web/build/index.html',
            -- que e exatamente onde o g5-request builda.
            requiredPerms = { RES .. '.admin', 'command' },
            permDefs = {
                { id = RES .. '.admin',       label = 'Admin Dispatch',    desc = 'Acesso total ao painel de dispatch', category = 'dispatch' },
                { id = RES .. '.alerts.edit', label = 'Editar Alertas',    desc = 'Criar/editar/excluir alertas',       category = 'dispatch' },
                { id = RES .. '.config.edit', label = 'Editar Config',     desc = 'Settings gerais, DefaultAlerts e Jobs', category = 'dispatch' },
                { id = RES .. '.zones.edit',  label = 'Editar Zonas/Blips', desc = 'Zonas contextuais e blips',          category = 'dispatch' },
            },
            description = 'Configuracao do sistema de dispatch / 911-311',
        })
    end)
    if not ok or result == false then
        print(('[%s] Falha ao registrar plugin no mri_Qadmin: %s'):format(RES, tostring(result)))
    end
end

CreateThread(function()
    local deadline = GetGameTimer() + 10000
    while GetResourceState('mri_Qadmin') ~= 'started' and GetGameTimer() < deadline do
        Wait(200)
    end
    registerPlugin()
end)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == 'mri_Qadmin' then
        Wait(500) -- aguarda os exports do Qadmin ficarem disponiveis
        registerPlugin()
    end
end)
