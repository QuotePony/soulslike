# Soulslike

Foundry VTT system for Soulslike RPG.

Made by Quote!

## Development

1. Install dependencies with `npm install`.
2. Make your changes inside the `src/` TypeScript or style sources.
3. Use `npm run build` for a one-off production bundle or `npm run build:watch` while iterating.
4. Link the `dist/` directory into your Foundry `systems` folder; `dist/system.json` is generated from the root manifest so paths resolve correctly inside the packaged build.
5. Run `npm run typecheck` whenever you want a fast type-only verification without emitting files.
