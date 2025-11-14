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
- `DefaultTimeout`: tempo padrão (ms) para expiração de requests.
- `AcceptKey` / `DenyKey`: teclas padrão para aceitar/recusar.

Exemplo:
```lua
Config = {
  Position = 'top-right',
  DefaultTimeout = 15000,
  AcceptKey = 'Y',
  DenyKey = 'N',
}
```

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
  timeout = 15000,
  tagColor = '#FF0000',
  progressColor = '#00FF00',
  codeColor = '#FFFFFF',
}
TriggerEvent('g5-request:server:send', 2, request)
```

## Envio a múltiplos alvos e espera por respostas (export)
Utilize o seguinte export para enviar requests a múltiplos alvos e aguardar respostas:
```lua
exports['g5-request']:sendAndWait(targetsTable, requestData, timeoutMs)
```

Retorna uma tabela com os resultados por player id:
```lua
{ [playerId] = { answered = boolean, accepted = boolean, timedOut = boolean } }
```

Exemplo:
```lua
local results = exports['g5-request']:sendAndWait({2,3}, requestData, 20000)
for pid, res in pairs(results) do
  print(pid, res.answered, res.accepted, res.timedOut)
end
```

## Comandos de teste (requer `group.admin`) 🧪
Para testar o envio de requests, utilize os seguintes comandos:
- `/sendtestrequest <target>` — envia um request de teste para `target` (server id).
- `/sendgrouptest <id1,id2,...>` — envia para múltiplos alvos e aguarda respostas.

## NUI / Endpoints
A NUI se comunica com o servidor através dos seguintes endpoints:
- `POST g5_request_answer` — usado para enviar a resposta (id, accepted).
- `POST g5_nui_ready` — disparado quando a NUI inicializa (para ajustar teclas/posição).

## Observações importantes ⚠️
- Requests expiram automaticamente após `timeout` e são tratados como recusados se o usuário não responder.
- O sistema usa filas por jogador no servidor; quando um jogador desconecta, sua fila é limpa.
- As IDs das requests são geradas automaticamente se não fornecidas.

Contribuições e melhorias são bem-vindas — abra PRs ou issues. 🙌

