import type SoulslikeActor from "../modules/objects/soulslikeActor.js";
import type { SoulslikeConfig } from "../modules/config.js";
import type { SoulslikeActorSystemData, SoulslikeItemSystemData } from "./system.js";

declare global {
  interface CONFIG {
    SOULSLIKE: SoulslikeConfig;
    INIT: boolean;
  }
}

declare module "fvtt-types/configuration" {
  interface AssumeHookRan {
    setup: never;
  }

  interface DocumentClassConfig {
    Actor: typeof SoulslikeActor;
  }

  interface DataConfig {
    Actor: {
      system: SoulslikeActorSystemData;
    };
    Item: {
      system: SoulslikeItemSystemData;
    };
  }
}

export {};
