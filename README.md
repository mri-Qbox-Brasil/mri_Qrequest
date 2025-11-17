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
- O envio direto via evento (`g5-request:server:send`) aplica um timeout padrão local de 8000 ms caso `requestData.timeout` não seja informado.

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
  timeout = 15000, -- se omitido, envio único cai para 8000ms no servidor
  tagColor = '#FF0000',
  progressColor = '#00FF00',
  codeColor = '#FFFFFF',
  sound = 'ping' -- opcional: nome do arquivo em html/assets/sound (sem extensão). Use 'off' para desativar.
}
TriggerEvent('g5-request:server:send', 2, request)
```

Detalhes sobre o campo `sound`:
- Pode ser um nome sem extensão (ex: `"ding"`). A NUI tentará carregar, na ordem: `assets/sound/<nome>.ogg`, `.mp3`, `.wav`.
- Se o nome já contiver extensão (ex: `alert.mp3`), será usado tal qual em `assets/sound/<nome>`.
- Use `"off"` (string) para desativar som.

## Envio a múltiplos alvos e espera por respostas (export)
Use o export para enviar requests a múltiplos alvos e aguardar respostas agregadas:

Server export:
```lua
local results = exports['g5-request']:sendAndWait(targetsTable, requestData, timeoutMs)
```

Client (via ox_lib callback):
```lua
-- cliente chama o servidor via callback (exemplo)
lib.callback('g5-request:sendAndWait', {2,3}, requestData, 20000, function(results)
  for pid, res in pairs(results) do
    print(pid, res.answered, res.accepted, res.timedOut)
  end
end)
```

Também é possível usar await:
```lua
local results = lib.callback.await('g5-request:sendAndWait', {2,3}, requestData, 20000)
for pid, res in pairs(results) do
  print(pid, res.answered, res.accepted, res.timedOut)
end
```

Formato do retorno:
- Retorna uma tabela indexada por server id com objetos:
  - `answered` (boolean): se o jogador respondeu.
  - `accepted` (boolean): se aceitou.
  - `timedOut` (boolean): se expirou sem resposta.

Internamente o servidor cria um `groupId` para correlacionar respostas e aguarda até `timeoutMs` (ou `Config.DefaultTimeout`) antes de devolver resultados.

## Callbacks / Eventos relevantes
- Evento para envio: `g5-request:server:send` (server-side).
- Callback server para respostas: `g5-request:answer` (registrado via `lib.callback.register` no servidor). Recebe (source, id, accepted) e retorna boolean indicando sucesso.
- Export server: `sendAndWait` (usa `pendingGroupRequests` internamente para agregar respostas).
- NUI endpoints (HTTP POST from NUI):
  - `POST g5_request_answer` — NUI envia a resposta com payload { id, accepted }.
  - `POST g5_nui_ready` — NUI notifica inicialização para receber teclas/posição.

## Comandos de teste (requer `group.admin`) 🧪
Para testar o envio de requests, utilize os seguintes comandos (implementados no servidor):
- `/sendtestrequest <target>` — envia um request de teste para `target` (server id).
- `/sendgrouptest <id1,id2,...>` — envia para múltiplos alvos e aguarda respostas (usa export internamente).

## NUI / comportamento do cliente
- A NUI recebe a tecla atual de aceitar/recusar (vinda do keybind registrado no cliente) ao inicializar via `init` message.
- A NUI toca sons conforme o campo `sound` (veja regras acima).
- Requests expiram automaticamente na NUI ao alcançar o timeout e então enviam resposta negativa ao servidor.
- A interface tenta calcular contraste de cores para texto automaticamente (caso sejam usados hex ou rgb).

## Observações importantes ⚠️
- Requests expiram automaticamente após `timeout` e são tratados como recusados se o usuário não responder.
- O sistema usa filas por jogador no servidor; quando um jogador desconecta, sua fila é limpa.
- As IDs das requests são geradas automaticamente se não fornecidas.
- Para chamadas de grupo, se um jogador não responder antes do timeout, o resultado para ele terá `answered = false`, `accepted = false` e `timedOut = true`.

Contribuições e melhorias são bem-vindas — abra PRs ou issues. 🙌

