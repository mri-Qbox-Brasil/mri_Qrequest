# g5-request 🚀

A lightweight request/notification system for FiveM with a modern NUI, theme support and utilities for sending requests to single players or groups.

Key features
- Sending requests to players via server event `g5-request:server:send`.
- Group sending + aggregation: `sendAndWait` export to send to multiple targets and wait for responses.
- Rich NUI: title, icon, tag, code, extras (icon/name/value), progress bar, sound and per-request themes.
- Customizable themes defined in `shared/theme.lua` (5 themes included: `default`, `ambulancia`, `police`, `bombeiro`, `recrutamento`).
- Duplicate prevention on server and notifications to originators when duplicates occur.
- Server exports to cancel and inspect requests: `cancelRequest`, `cancelGroup`, `getRequestStatus`, `getGroupStatus`.
- Uses `ox_lib` for keybinds and `lib.callback` for responses.

Requirements
- FiveM / fxserver
- `ox_lib` (declared dependency in `fxmanifest.lua`)

Installation
1. Copy the `g5-request` folder into your server `resources` directory.
2. Add `ensure g5-request` to your `server.cfg`.
3. Make sure `ox_lib` is installed on your server.

Optional: NUI development
The front-end is in `web/` (React + Vite + Tailwind). To run the dev server:

```powershell
cd web
npm install
npm run dev
```

To build the front-end and copy artifacts into `html/` used by the resource:

```powershell
# run from repository root
npm run build
```

The root helper scripts copy the built files from `web/build` into `html/` and preserve any `sound` folders so you can place audio assets on the server without them being overwritten.

Configuration (`shared/config.lua`)
- `Position`: `'top-right'` | `'top-left'` — UI position.
- `DefaultTimeout`: default timeout in ms for `sendAndWait` and fallback behavior.
- `AcceptKey` / `DenyKey`: fallback keys for accept/deny (client registers keybinds with `ox_lib`).

Example:

```lua
Config = {
  Position = 'top-right',
  DefaultTimeout = 15000,
  AcceptKey = 'Y',
  DenyKey = 'N',
}
```

Sending a request (server-side)
Use the server event to send a request to a player:

```lua
TriggerEvent('g5-request:server:send', targetServerId, requestData)
```

Common `requestData` fields
- `title` (string)
- `titleIcon` (string)
- `tag` (string)
- `code` (string)
- `extras` (array of { icon, name, value })
- `timeout` (ms)
- `themeType` (string) — selects a theme from `Themes`
- `tagColor`, `progressColor`, `codeColor` (per-request color overrides)
- `sound` (string) — audio file name in `html/assets/sound` (without extension) or with extension; use `'off'` to disable sound.

Minimal example:

```lua
local req = {
  title = 'Request',
  titleIcon = 'user',
  tag = 'INFO',
  code = '1234',
  extras = { { icon = 'info', name = 'Note', value = 'Details here' } },
  timeout = 15000,
  themeType = 'default',
  sound = 'mixkit-doorbell-tone-2864'
}
TriggerEvent('g5-request:server:send', 2, req)
```

Send to multiple targets and wait for responses

Server export:

```lua
local results = exports['g5-request']:sendAndWait({2,3}, requestData, 20000)
```

Or via callback/await:

```lua
local results = lib.callback.await('g5-request:sendAndWait', {2,3}, requestData, 20000)
```

Return format (per player id):
- `answered` (bool)
- `accepted` (bool)
- `timedOut` (bool)
- `canceled` (bool)
- `pending` (bool) — true if the request was considered a duplicate for that target and was not re-sent.

Cancel / Status / Server exports
- `exports['g5-request']:cancelRequest(targetServerId, requestId)` — cancel a single request (returns boolean).
- `exports['g5-request']:cancelGroup(groupId)` — cancel an entire group (returns boolean).
- `exports['g5-request']:getRequestStatus(targetServerId, idOrMatcher)` — inspect a player's queue.
- `exports['g5-request']:getGroupStatus(groupId)` — inspect a group's aggregated results.

Callbacks and internal callbacks
- The server registers `g5-request:answer` via `lib.callback.register` to receive client answers.
- `g5-request:sendAndWait` is also registered for callback-style usage.

Events / Notifications
- `g5-request:server:send` — server-side event to send a request.
- `g5-request:client:add` — client event to add a request to NUI.
- `g5-request:client:remove` — client event to remove a request from UI.
- `g5-request:client:prolong` — client event to reset timeout on an existing request.
- `g5-request:server:duplicate_notify` — client notification when a send is duplicate.
- `g5-request:server:accepted_notify` / `g5-request:server:denied_notify` — originator notifications when target accepts/denies.
- `g5-request:server:send:duplicate` — server event triggered when a send is detected as duplicate.

NUI messages used by the Lua client
- `init` — initialize NUI (themes, positions, keybinds)
- `add` — add request
- `remove` — remove request by id
- `prolong` — replace/reset timeout for a request
- `flashAccept` / `flashDeny` — trigger accept/deny animations on a request
- `setVisible` — toggles visibility

Client keybinds
- Two keybinds are registered via `ox_lib` on the client:
  - `g5_req_accept` — accept key (fallback from `Config.AcceptKey`, default `Y`)
  - `g5_req_deny` — deny key (fallback `Config.DenyKey`, default `N`)

Themes (`shared/theme.lua`)
- Themes are keyed (e.g. `ambulancia`, `police`, `bombeiro`, `recrutamento`, `default`).
- Theme fields include `card_bg`, `title_bg`, `text`, `muted`, `tag_bg`, `tag_fg`, `code_bg`, `code_fg`, `progress_bg`, `progress_color`, `accent`, `card_width`, `card_gap`.
- Color formats supported: hex (`#rrggbb` or `#rrggbbaa`) and `rgba(r,g,b,a)`.

Sound
- The `sound` field expects a file in `html/assets/sound`. The front-end checks for `.ogg`, `.mp3`, `.wav` (the repo contains `.wav` variants for the mixkit filenames).
- Use `'off'` to disable.

Developer/test commands (require `group.admin` ACL)
- `/sendtestrequest <target>` — send a sample request to a player.
- `/sendgrouptest <id1,id2,...>` — send group test and print results.
- `/cancelrequest <targetServerId> <requestId>` — helper to cancel.
- `/testthemes <target>` — send a sequence of themed requests to test visuals and sounds.

Quick examples

Send a simple request:

```lua
TriggerEvent('g5-request:server:send', 2, {
  title = 'Help', tag = 'HELP', code = 'A1', timeout = 15000
})
```

Send to multiple players and handle results:

```lua
local results = exports['g5-request']:sendAndWait({2,3,4}, { title='Vote', tag='VOTE' }, 20000)
for pid,res in pairs(results) do
  print(pid, res.accepted, res.timedOut, res.pending)
end
```

Repository structure (summary)

```
g5-request/
  ├─ client/
  │   └─ main.lua
  ├─ server/
  │   └─ main.lua
  ├─ shared/
  │   ├─ config.lua
  │   └─ theme.lua
  ├─ html/       # NUI artifacts copied from web/build
  ├─ web/        # front-end React + Vite (dev)
  ├─ fxmanifest.lua
  └─ README.md
```

Contributions welcome — open PRs or issues for fixes, new themes, or feature requests.

---
_This English README was generated from the repository's Portuguese README and code analysis._
