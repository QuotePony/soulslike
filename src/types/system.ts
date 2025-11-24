export interface SoulslikeActorSystemData {
  hp?: {
    current?: number;
    min?: number;
  };
  level?: number;
  supplies?: number;
  capacity?: number;
  Vitality?: number;
  Posture?: number;
  Evasion?: number;
  Strength?: number;
  Dexterity?: number;
  Spells?: number;
  Incantations?: number;
  hands?: Record<string, string | null>;
  note?: string;
  log?: string;
  [key: string]: unknown;
}

export interface SoulslikeItemSystemData {
  tags?: string;
  description?: string;
  damage_die?: string;
  damage_stat?: string;
  action1?: string;
  action2?: string;
  [key: string]: unknown;
}
