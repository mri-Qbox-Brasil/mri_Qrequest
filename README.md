# mriQ_request 🚀

Pequeno sistema de "requests" (notificações com opção de aceitar/recusar) para FiveM, com UI NUI e utilitários para envio individual ou em grupo.

## Principais recursos
 - 📨 Envio de requests para jogadores (cliente/server).
 - 🖼️ UI NUI com tempo, barra de progresso e extras customizáveis.
 - 👥 Suporte para envio a múltiplos alvos e espera por respostas (export `sendAndWait`).
 - ⚙️ Configuração central em `shared/config.lua`.
 - 🔗 Dependência: `ox_lib`.

## Instalação rápida
1. Copie a pasta `g5-request` para a pasta de recursos do servidor.
2. Adicione `ensure g5-request` no `server.cfg`.
3. Tenha `ox_lib` instalado e disponível no servidor.

### Frontend (desenvolvimento local)

O projeto inclui uma versão React/Vite para desenvolvimento em `web/` (NUI em React + Tailwind).

Recomendações rápidas para rodar o painel de desenvolvimento:

```powershell
cd web
npm install
# Instale as dependências do Tailwind (se ainda não estiverem instaladas)
npm install -D tailwindcss postcss autoprefixer
# iniciar servidor de desenvolvimento
npm run start
```

Observações (dev):
- Para o dev server servir os sons usados pela NUI, copie os assets para `web/public/assets` (ou crie um link/robocopy). Exemplo:

```powershell
# do diretório raíz do repo
mkdir web\public\assets\sound -Force
robocopy html\assets web\public\assets /E
```

- O painel de testes (`DevPanel`) aparece automaticamente quando a aplicação detectar que está rodando num navegador (modo dev). Ele permite disparar mensagens que simulam os eventos NUI originais (`add`, `remove`, `flashAccept`, `flashDeny`, `prolong`, `init`).

### Build & Deploy (automação raiz)

Existe um script na raiz do repositório que compila a aplicação web e copia os artefatos para a pasta `html/` utilizada pelo recurso FiveM. Ele facilita o deploy sem precisar rodar manualmente comandos dentro de `web/`.

- Para gerar a build e copiar para `html/` rode (na raiz do repo):

```powershell
cd G:\path\to\g5-request
npm run build
```

- O que esse script faz:
	- executa um instalador condicional em `web/` que roda `npm install` somente se `web/node_modules` estiver faltando ou vazio (`scripts/installIfMissing.js`).
	- roda `npm run build` dentro de `web/` (Vite build) gerando a pasta `web/build/`.
	- executa `scripts/copyBuild.js` que copia recursivamente `web/build/*` para `html/`.

- Notas sobre o comportamento do copy:
	- Antes de copiar, o script limpa `html/` recursivamente, **mas preserva qualquer pasta chamada** `sound` (em qualquer nível, ex: `html/sound` ou `html/assets/sound`). Isso evita sobrescrever/errar os arquivos de áudio que você colocará manualmente no servidor.
	- Arquivos existentes em `html/` diferentes de `sound` serão removidos e substituídos pelos gerados em `web/build/`.

- Saída de build padrão (exemplo): `web/build/index.html`, `web/build/assets/scripts.js`, `web/build/assets/styles.css`.
	- Observação: a configuração atual gera nomes fixos para os bundles (para facilitar integração NUI), portanto lembre de limpar cache do cliente ou usar versionamento manual após deploy.

- `postinstall` na raiz também chama o instalador condicional: ao rodar `npm install` na raiz, o script garante que `web` tenha suas dependências instaladas caso necessário.

- Em CI, para instalações reprodutíveis, prefira usar `npm ci --prefix web`; posso alterar o comportamento do instalador condicional para usar `ci` se desejar.

## Tema / Customização (NUI)

O sistema agora suporta **múltiplos temas** por tipo de request! Você pode definir temas diferentes para ambulância, polícia, bombeiro, recrutamento, etc. e o sistema aplica automaticamente baseado no tipo do request.

### Configuração de temas

Os temas são definidos no arquivo `shared/theme.lua` como uma tabela indexada por tipo:

```lua
Themes = {
    ['default'] = {
        card_bg = 'rgba(6,8,10,0.78)',
        title_bg = 'rgba(0,0,0,0.55)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(34,197,94,0.14)',
        tag_fg = '#042712',
        progress_color = '#16A34A',
        accent = '#22C55E',
        -- ...
    },
    ['bombeiro'] = {
        card_bg = 'rgba(10,6,6,0.78)',
        tag_bg = 'rgba(249,115,22,0.14)',
        tag_fg = '#7c2d12',
        progress_color = '#ea580c',
        accent = '#f97316',
        -- ...
    },
    ['ambulancia'] = {
        -- tema vermelho para ambulância
    },
    ['police'] = {
        -- tema azul para polícia
    },
    -- ... adicione mais temas conforme necessário
}
```

### Temas padrão incluídos

O sistema já vem com 5 temas pré-configurados:
- **default**: Verde (tema padrão)
- **ambulancia**: Vermelho (para serviços médicos)
- **police**: Azul (para polícia)
- **bombeiro**: Laranja (para bombeiros)
- **recrutamento**: Roxo (para processos de recrutamento)

### Usando temas em requests

Para aplicar um tema específico a um request, adicione o campo `themeType`:

```lua
local request = {
    title = 'Chamado Médico',
    tag = 'AMBULANCIA',
    code = 'A1',
    themeType = 'ambulancia', -- aplica o tema de ambulância
    extras = {
        { icon = 'heart', name = 'Urgência', value = 'Alta' }
    },
    timeout = 15000
}
TriggerEvent('g5-request:server:send', targetId, request)
```

Se `themeType` não for especificado, o tema `default` será usado.

### Campos de tema disponíveis

- **Cores de fundo**: `card_bg`, `title_bg`, `progress_bg`
- **Cores de texto**: `text`, `muted`, `tag_fg`, `code_fg`
- **Cores de destaque**: `tag_bg`, `code_bg`, `progress_color`, `accent`
- **Tamanhos**: `card_width` (ex: `360px`), `card_gap` (ex: `12px`)
- **Imagem de fundo** (opcional): `bg_image`, `bg_size`, `bg_position`

### Formatos de cor aceitos

- `#rrggbb` ou `#rgb` (hex)
- `#rrggbbaa` (hex com alpha/transparência)
- `rgba(r,g,b,a)` (função CSS)

### Arquitetura do sistema de temas

O sistema utiliza React Context para gerenciar temas:
- **ThemeContext** (`web/src/contexts/ThemeContext.tsx`): Gerencia os temas e aplica CSS variables
- **ThemeProvider**: Envolve a aplicação e fornece acesso aos temas
- Os temas são enviados do servidor via NUI message (`action: 'init'`)
- Cada request pode especificar seu `themeType` para trocar de tema dinamicamente

Recomendações:
- Prefira usar `rgba()` ou `#rrggbbaa` se precisar de transparência
- Mantenha consistência nas cores de cada tipo de serviço
- Teste os temas em diferentes condições de iluminação do jogo



## Estrutura de arquivos 📁
```
g5-request/
	├── client/                # scripts cliente
	│   └── main.lua
	├── server/                # scripts servidor
	│   └── main.lua
	├── shared/                # configurações compartilhadas
	│   └── config.lua
	├── html/                  # UI NUI
	│   ├── index.html
	│   ├── script.js
	│   └── style.css
	├── fxmanifest.lua
	└── README.md
```

## Configuração (shared/config.lua) ⚙️
Ajuste as seguintes opções conforme necessário:
 - `Position`: `'top-right'` | `'top-left'` — posição padrão da UI.
 - `DefaultTimeout`: tempo padrão (ms) usado por operações de grupo/export `sendAndWait`.
 - `AcceptKey` / `DenyKey`: teclas padrão para aceitar/recusar (são usadas como fallback; o cliente registra keybinds via ox_lib e envia a tecla atual para a NUI na inicialização).

Exemplo:
```lua
Config = {
	Position = 'top-right',
	DefaultTimeout = 15000,
	AcceptKey = 'Y',
	DenyKey = 'N',
}
```

Observação importante sobre timeouts:
 - O export `sendAndWait` usa `Config.DefaultTimeout` como fallback se nenhum timeout for passado.
 - O envio direto via evento (`g5-request:server:send`) aplica um timeout padrão de 15000 ms caso `requestData.timeout` não seja informado (veja `server/main.lua`).

## Como enviar um request (server-side)
Utilize o evento para enviar um request a um jogador:
```lua
TriggerEvent('g5-request:server:send', targetServerId, requestData)
```

Exemplo mínimo de `requestData`:
```lua
local request = {
	title = 'Pedido',
	titleIcon = 'user',
	tag = 'INFO',
	code = '1234',
	extras = {
		{ icon = 'info', name = 'Obs', value = 'Detalhes aqui' }
	},
	timeout = 15000, -- se omitido, envio único usa 15000ms por padrão no servidor
	tagColor = '#FF0000',
	progressColor = '#00FF00',
	codeColor = '#FFFFFF',
	sound = 'ping' -- opcional: nome do arquivo em html/assets/sound (sem extensão). Use 'off' para desativar.
}
TriggerEvent('g5-request:server:send', 2, request)
```

Detalhes sobre o campo `sound`:
 - Pode ser um nome sem extensão (ex: `"ding"`). A NUI tentará carregar arquivos na pasta `html/assets/sound` com extensões comuns.
 - Se o nome já contiver extensão (ex: `alert.mp3`), será usado tal qual em `assets/sound/<nome>`.
 - Use `"off"` (string) para desativar som.

## Envio a múltiplos alvos e espera por respostas (export)
Use o export para enviar requests a múltiplos alvos e aguardar respostas agregadas:

Server export:
```lua
local results = exports['g5-request']:sendAndWait(targetsTable, requestData, timeoutMs)
```

Também é possível chamar via callback/await fornecido pelo sistema de callbacks (`lib.callback`):
```lua
local results = lib.callback.await('g5-request:sendAndWait', {2,3}, requestData, 20000)
for pid, res in pairs(results) do
	print(pid, res.answered, res.accepted, res.timedOut, res.canceled, res.pending)
end
```

Formato do retorno:
 - Retorna uma tabela indexada por server id com objetos:
	 - `answered` (boolean): se o jogador respondeu.
	 - `accepted` (boolean): se aceitou.
	 - `timedOut` (boolean): se expirou sem resposta.
	 - `canceled` (boolean): se o request foi cancelado.
	 - `pending` (boolean): se o request não foi enviado por ser considerado duplicado (já pendente) — nesse caso `answered=false` e `pending=true`.

Internamente o servidor cria um `groupId` para correlacionar respostas e aguarda até `timeoutMs` (ou `Config.DefaultTimeout`) antes de devolver resultados.

## Cancelamento de requests

Você pode cancelar um request individual ou um grupo:

 - Evento server (qualquer script/server-side):
```lua
-- cancela request específico enviado ao player 2 com id "abcd1234"
TriggerEvent('g5-request:server:cancel', 2, 'abcd1234')

-- cancela um grupo pelo groupId (ex: "group:16409952001234")
TriggerEvent('g5-request:server:cancel', 'group:16409952001234')
```

 - Exports (server):
```lua
-- cancelamento individual (retorna boolean indicando sucesso)
local ok = exports['g5-request']:cancelRequest(targetServerId, requestId)

-- cancelamento de grupo (retorna boolean indicando sucesso)
local ok = exports['g5-request']:cancelGroup(groupId)
```

 - Comando de teste (server, requer `group.admin`):
```
/cancelrequest <targetServerId> <requestId>
```

Quando cancelado:
 - O jogador alvo terá o request removido da UI (se estiver visível). Internamente o servidor envia o evento cliente `g5-request:client:remove` para forçar a remoção local.
 - Se o request pertencer a um envio em grupo (`sendAndWait` / export), o resultado para aquele jogador terá o campo `canceled = true`.

Observação adicional sobre comportamento:
 - Cancelar um grupo marca o grupo como cancelado e tenta remover todos os requests relacionados nas filas dos jogadores; os resultados do export `sendAndWait` para esses alvos terão `canceled = true`.

## Status / Verificação de requests

Fornecemos APIs para checar o status de requests (úteis para scripts que devem auditar ou reagir a estados):

 - Exports (server):
```lua
-- retorna tabela resumida ou informação específica
local info = exports['g5-request']:getRequestStatus(targetServerId, requestIdOrMatcher)
local group = exports['g5-request']:getGroupStatus(groupId)
```

 - Callbacks (pode usar lib.callback/await ou lib.callback):
```lua
local info = lib.callback.await('g5-request:getRequestStatus', targetServerId, requestIdOrMatcher)
local group = lib.callback.await('g5-request:getGroupStatus', groupId)
```

Formato de retorno de getRequestStatus:
 - Quando chamado só com target (segundo argumento nil): { found = boolean, queue = { {id, from, code, tag, timeout, groupId}, ... } }
 - Quando chamado com id: { found = true, inQueue = true, request = <requestData> } ou { found = false }

Formato de retorno de getGroupStatus:
 - { created = <timestamp>, canceled = <boolean>, results = { [targetId] = { answered, accepted, timedOut, canceled, pending }, ... }, pendingTargets = { [targetId] = true, ... } }

## Callbacks / Eventos relevantes
 - Evento para envio: `g5-request:server:send` (server-side).
 - Callback server para respostas: `g5-request:answer` (registrado via `lib.callback.register` no servidor). Recebe (source, id, accepted) e retorna boolean indicando sucesso.
 - Export server: `sendAndWait` (usa `pendingGroupRequests` internamente para agregar respostas).
 - Eventos/notifications ao originador em casos de duplicata:
	 - Cliente originador recebe: `g5-request:server:duplicate_notify` (targetId, requestData, existingRequestId)
	 - Server-side pode capturar `g5-request:server:send:duplicate` quando o envio for duplicado.

## Comandos de teste (requer `group.admin`) 🧪
Para testar o envio de requests, utilize os seguintes comandos (implementados no servidor):
 - `/sendtestrequest <target>` — envia um request de teste para `target` (server id).
 - `/sendgrouptest <id1,id2,...>` — envia para múltiplos alvos e aguarda respostas (usa export internamente).
 - `/testthemes <target>` — envia 5 requests sequenciais testando todos os temas predefinidos (ambulancia, police, bombeiro, recrutamento, default).

## NUI / comportamento do cliente
 - A NUI recebe a tecla atual de aceitar/recusar (vinda do keybind registrado no cliente) ao inicializar via `init` message.
 - A NUI toca sons conforme o campo `sound` (veja regras acima).
 - Requests expiram automaticamente na NUI ao alcançar o timeout e então enviam resposta negativa ao servidor.
 - A interface tenta calcular contraste de cores para texto automaticamente (caso sejam usados hex ou rgb).

## Observações importantes ⚠️
 - Requests expiram automaticamente após `timeout` e são tratados como não respondidos se o usuário não responder (o servidor marca `timedOut = true`).
 - O sistema usa filas por jogador no servidor; quando um jogador desconecta, sua fila é limpa.
 - As IDs das requests são geradas automaticamente se não fornecidas.
 - Para chamadas de grupo, se um jogador não responder antes do timeout, o resultado para ele terá `answered = false`, `accepted = false` e `timedOut = true`.

Contribuições e melhorias são bem-vindas — abra PRs ou issues. 🙌

## Comportamento de duplicatas / request pendente
 - Se você tentar enviar o "mesmo" request para um jogador duas vezes (mesma id, ou mesma combinação originador+code+tag), o servidor evita inserir duplicatas na fila.
 - Para chamadas via export `sendAndWait`, alvos que já possuíam o mesmo request receberão um resultado com `pending = true` (e `answered=false`), permitindo que o chamador saiba que o request já está pendente.
 - Quando um envio simples via evento for duplicado, o originador é notificado via client event `g5-request:server:duplicate_notify` ou via evento server `g5-request:server:send:duplicate` para handlers server-side.

Prolongamento (prolong)
 - Você pode solicitar que um request já pendente tenha seu timeout reiniciado usando o campo `prolong` no `requestData`.
 - `prolong = <number>` — define o novo timeout em ms e REINICIA o timer para esse valor.
 - `prolong = true` e `requestData.timeout = <number>` — usa `requestData.timeout` como novo timeout e REINICIA o timer.
 - Observação: o comportamento é de "reset" (redefinir o tempo restante), não "adicionar" ao tempo restante do request existente.

## Exemplos práticos

1) Envio simples (server-side)

```lua
local request = {
	title = 'Pedido de Ajuda',
	titleIcon = 'user',
	tag = 'HELP',
	code = 'A1',
	extras = {
		{ icon = 'map-marker', name = 'Local', value = 'Praça Central' },
		{ icon = 'clock', name = 'Tempo', value = '30s' }
	},
	timeout = 15000,
	sound = 'mixkit-doorbell-tone-2864'
}
TriggerEvent('g5-request:server:send', 2, request)
```

2) Envio para múltiplos alvos e espera por respostas (server-side, export)

```lua
local targets = {2, 3, 5}
local requestData = {
	title = 'Votação Rápida',
	tag = 'VOTE',
	code = 'V123',
	timeout = 20000
}

-- usando export
local results = exports['g5-request']:sendAndWait(targets, requestData, requestData.timeout)
for pid, res in pairs(results) do
	print(('Player %s => answered=%s accepted=%s timedOut=%s pending=%s'):format(pid, tostring(res.answered), tostring(res.accepted), tostring(res.timedOut), tostring(res.pending)))
end
```

3) Uso com lib.callback.await (server-side)

```lua
local results = lib.callback.await('g5-request:sendAndWait', {2,3}, requestData, 20000)
-- processar results como no exemplo anterior
```

4) Cancelar um request específico (server-side)

```lua
-- cancela o request com id 'abcd' enviado para o player 2
TriggerEvent('g5-request:server:cancel', 2, 'abcd')
```

5) Consultar status de fila / grupo

```lua
local info = exports['g5-request']:getRequestStatus(2) -- lista a fila do jogador 2
local status = exports['g5-request']:getRequestStatus(2, 'abcd') -- procura request por id
local group = exports['g5-request']:getGroupStatus('16409952001234') -- retorna status do grupo
```
