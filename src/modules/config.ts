import type { SoulslikeAPI } from "./api.js";

export interface SoulslikeConfig {
  attributes: Record<string, string>;
  api?: SoulslikeAPI;
}

export const SOULSLIKE: SoulslikeConfig = {
  attributes: {
    Test: "TEST!"
  }
};
