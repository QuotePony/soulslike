import type { SoulslikeAPI } from "../modules/api.js";

declare global {
  namespace foundry.packages {
    interface System {
      api?: SoulslikeAPI;
    }
  }

  interface Game {
    readonly system: foundry.packages.System & { api?: SoulslikeAPI };
  }
}

export {};
