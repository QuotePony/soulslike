# Soulslike

Foundry VTT system for Soulslike RPG.

Made by Quote!

## Development

1. Install dependencies with `npm install`.
2. Make your changes inside the `src/` TypeScript or style sources.
3. Use `npm run build` for a one-off production bundle or `npm run build:watch` while iterating.
4. Link the `dist/` directory into your Foundry `systems` folder; `dist/system.json` is generated from the root manifest so paths resolve correctly inside the packaged build.
5. Run `npm run typecheck` whenever you want a fast type-only verification without emitting files.

## System API

Common helpers are exposed at `game.system.api` (also available via `CONFIG.SOULSLIKE.api`) once the system finishes `init`. They are safe to consume from macros or modules.

- **Actor helpers**
  - `api.actors.setNote(actor, text)` and `api.actors.addLogEntry(actor, data)` provide consistent updates to journaling fields in `system` data.
  - `api.actors.setHand(actor, handId, payload)`, `setHands`, and `clearHands` normalize what gets stored under `system.hands.*` whether you pass an Item, raw JSON, or string id.
  - `api.actors.updateSystemValue(actor, path, value)` updates any `system.*` path using dot-notation (e.g. `hp.current`).
- **Drag & drop**
  - `api.dragdrop.handleSheetDrop(event, data, targets)` is the shared router used by core sheets.
  - `api.dragdrop.registerSheetTargets(api.dragdrop.sheetKeys.character, [...])` lets you append drop zones without subclassing existing sheets.
- **Sheet utilities**
  - `api.sheets.createScrollState`, `captureScrollPosition`, `restoreScrollPosition`, and `bindScrollPersistence` keep scroll positions stable across renders.
  - `api.sheets.initializeTabs(sheet, { navSelector, contentSelector, initial, onChange })` wires up Foundry's v2 tab widget with a single call.

Everything is typed through `fvtt-types`, so IDEs will surface the API automatically.
