export interface SoulslikeActorSystemData {
  note?: string;
  log?: unknown[];
  hands?: Record<string, string>;
  [key: string]: unknown;
}

export interface SoulslikeItemSystemData {
  [key: string]: unknown;
}
