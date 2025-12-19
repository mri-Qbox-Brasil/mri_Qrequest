-- ============================================================================
-- EXEMPLOS DE USO DOS TEMAS DO SISTEMA G5-REQUEST
-- ============================================================================
-- Este arquivo mostra como enviar requests com temas personalizados.
--
-- COMANDO RÁPIDO DE TESTE:
-- Use o comando /testthemes <targetId> no servidor para testar todos os 
-- temas de uma vez! Exemplo: /testthemes 2
-- ============================================================================

-- Exemplo 1: Request de ambulância (tema vermelho)
local function enviarChamadoAmbulancia(targetId, localizacao)
    local request = {
        title = 'Chamado Médico',
        titleIcon = 'ambulance',
        tag = 'AMBULÂNCIA',
        code = 'A-' .. math.random(100, 999),
        themeType = 'ambulancia', -- Define o tema vermelho
        extras = {
            { icon = 'map-marker', name = 'Local', value = localizacao },
            { icon = 'heartbeat', name = 'Urgência', value = 'Alta' },
            { icon = 'user', name = 'Paciente', value = 'Civil ferido' }
        },
        timeout = 20000,
        sound = 'mixkit-doorbell-tone-2864'
    }
    TriggerEvent('g5-request:server:send', targetId, request)
end

-- Exemplo 2: Request de polícia (tema azul)
local function enviarChamadoPolicia(targetId, ocorrencia)
    local request = {
        title = 'Ocorrência Policial',
        titleIcon = 'shield',
        tag = 'POLÍCIA',
        code = 'P-' .. math.random(100, 999),
        themeType = 'police', -- Define o tema azul
        extras = {
            { icon = 'map-marker', name = 'Local', value = ocorrencia.local },
            { icon = 'exclamation-triangle', name = 'Tipo', value = ocorrencia.tipo },
            { icon = 'clock', name = 'Tempo', value = '15s' }
        },
        timeout = 15000,
        sound = 'mixkit-sci-fi-click-900'
    }
    TriggerEvent('g5-request:server:send', targetId, request)
end

-- Exemplo 3: Request de bombeiro (tema laranja)
local function enviarChamadoBombeiro(targetId, emergencia)
    local request = {
        title = 'Emergência Bombeiros',
        titleIcon = 'fire',
        tag = 'BOMBEIRO',
        code = 'B-' .. math.random(100, 999),
        themeType = 'bombeiro', -- Define o tema laranja
        extras = {
            { icon = 'map-marker', name = 'Local', value = emergencia.local },
            { icon = 'fire', name = 'Situação', value = emergencia.tipo },
            { icon = 'exclamation', name = 'Risco', value = 'Médio' }
        },
        timeout = 18000,
        sound = 'mixkit-gaming-lock-2848'
    }
    TriggerEvent('g5-request:server:send', targetId, request)
end

-- Exemplo 4: Request de recrutamento (tema roxo)
local function enviarConviteRecrutamento(targetId, organizacao)
    local request = {
        title = 'Convite de Recrutamento',
        titleIcon = 'users',
        tag = 'RECRUTAMENTO',
        code = 'R-' .. math.random(100, 999),
        themeType = 'recrutamento', -- Define o tema roxo
        extras = {
            { icon = 'building', name = 'Organização', value = organizacao },
            { icon = 'star', name = 'Cargo', value = 'Recruta' },
            { icon = 'info-circle', name = 'Benefícios', value = 'Salário + Benefícios' }
        },
        timeout = 30000,
        acceptText = 'Aceitar Convite',
        denyText = 'Recusar',
        sound = 'mixkit-confirmation-tone-2867'
    }
    TriggerEvent('g5-request:server:send', targetId, request)
end

-- Exemplo 5: Request padrão (tema verde - default)
local function enviarRequestGenerico(targetId, dados)
    local request = {
        title = dados.titulo or 'Solicitação',
        titleIcon = dados.icone or 'info',
        tag = dados.tag or 'INFO',
        code = dados.codigo or 'G-' .. math.random(100, 999),
        -- themeType não especificado = usa o tema 'default' (verde)
        extras = dados.extras or {
            { icon = 'info', name = 'Mensagem', value = 'Informação geral' }
        },
        timeout = 15000,
        sound = 'mixkit-interface-option-select-2573'
    }
    TriggerEvent('g5-request:server:send', targetId, request)
end

-- Exemplo 6: Enviando para múltiplos alvos com tema específico
local function enviarAvisoEmMassa(targets, mensagem)
    local request = {
        title = 'Aviso Importante',
        titleIcon = 'bullhorn',
        tag = 'AVISO',
        code = 'AV-' .. math.random(100, 999),
        themeType = 'default', -- Tema verde padrão
        extras = {
            { icon = 'info-circle', name = 'Mensagem', value = mensagem }
        },
        timeout = 20000
    }
    
    -- Usando o export para enviar a múltiplos alvos
    local results = exports['g5-request']:sendAndWait(targets, request, 20000)
    
    -- Processando resultados
    for pid, res in pairs(results) do
        if res.accepted then
            print(('Player %s aceitou o aviso'):format(pid))
        elseif res.timedOut then
            print(('Player %s não respondeu a tempo'):format(pid))
        else
            print(('Player %s recusou o aviso'):format(pid))
        end
    end
end

-- Exemplo 7: Personalizando cores individuais (sobrescreve o tema)
local function enviarRequestPersonalizado(targetId)
    local request = {
        title = 'Request Personalizado',
        tag = 'CUSTOM',
        code = 'C-123',
        themeType = 'police', -- Começa com tema azul
        -- Mas sobrescreve cores específicas:
        tagColor = '#FFD700', -- Dourado
        progressColor = '#FFD700',
        codeColor = '#1a1a1a',
        extras = {
            { icon = 'star', name = 'VIP', value = 'Exclusivo' }
        },
        timeout = 15000
    }
    TriggerEvent('g5-request:server:send', targetId, request)
end

-- ============================================================================
-- COMANDO DE TESTE INTEGRADO NO SERVER
-- ============================================================================
--[[
    O servidor já inclui o comando /testthemes que envia todos os temas
    automaticamente com exemplos predefinidos. Basta usar:
    
    /testthemes <targetServerId>
    
    Exemplo: /testthemes 2
    
    Isso enviará 5 requests sequenciais (ambulancia, police, bombeiro, 
    recrutamento, default) com delays de 1.5s entre eles.
]]

-- Comando alternativo para uso customizado (requer admin)
RegisterCommand('testar-temas-custom', function(source, args)
    if not IsPlayerAceAllowed(source, 'group.admin') then return end
    
    local target = tonumber(args[1])
    if not target then
        print('Uso: /testar-temas-custom <id>')
        return
    end
    
    -- Envia um request de cada tema usando as funções de exemplo acima
    Wait(0)
    enviarChamadoAmbulancia(target, 'Hospital Central')
    Wait(1000)
    enviarChamadoPolicia(target, { local = 'Delegacia', tipo = 'Assalto' })
    Wait(1000)
    enviarChamadoBombeiro(target, { local = 'Prédio Downtown', tipo = 'Incêndio' })
    Wait(1000)
    enviarConviteRecrutamento(target, 'Organização XYZ')
    Wait(1000)
    enviarRequestGenerico(target, { titulo = 'Teste Padrão', tag = 'TEST', codigo = 'T-001' })
end, true)

-- Exemplo de uso em outros scripts:
--[[
    -- No seu script de ambulância:
    exports['g5-request']:sendAndWait({targetId}, {
        title = 'Chamado Médico',
        themeType = 'ambulancia',
        -- ...
    }, 20000)
    
    -- No seu script de polícia:
    TriggerEvent('g5-request:server:send', targetId, {
        title = 'Backup Requisitado',
        themeType = 'police',
        -- ...
    })
]]

