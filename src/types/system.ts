export interface SoulslikeActorSystemData {
  hp?: {
    current?: number;
    min?: number;
  };
  stamina?: {
    current?: number;
    max?: number;
  };
  level?: number;
  supplies?: number;
  capacity?: number;
  Vitality?: number;
  Posture?: number;
  postureCurrent?: number;
  Evasion?: number;
  Strength?: number;
  Dexterity?: number;
  Intellect?: number;
  Faith?: number;
  inventory_limit?: number;
  shielding?: number;
  recurring_damage?: {
    damage_type?: string;
    amount?: number;
  };
  magic_uses?: {
    physical?: number;
    intellect?: number;
    faith?: number;
  };
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
