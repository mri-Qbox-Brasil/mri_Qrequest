// Shape do snapshot de config admin trocado com o Lua (server/config_store.lua
// buildSnapshot). Mantém drift control manual com o lado Lua.

export interface AlertDef {
  code: string;
  icon: string;
  priority: number; // 1 = alta, 2 = padrão, 3 = baixa
  groups: string[];
  tag?: string;
  vehicle?: boolean;
  gender?: boolean;
  weapon?: boolean;
  unit?: boolean;
  alertTime?: number;
}

export interface BlipDef {
  radius?: number;
  sprite: number;
  color: number;
  scale?: number;
  length?: number;
  sound?: string;
  sound2?: string;
  offset?: boolean;
  flash?: boolean;
}

export interface Coords {
  x: number;
  y: number;
  z: number;
}

export interface HuntingZone {
  label?: string;
  radius: number;
  coords: Coords;
}

export interface NoDispatchZone {
  label?: string;
  coords: Coords;
  length?: number;
  width?: number;
  heading?: number;
  minZ?: number;
  maxZ?: number;
}

export interface AdminSettings {
  DefaultTimeout: number;
  AlertTime: number;
  OnDutyOnly: boolean;
  PhoneRequired: boolean;
  PhoneItems: string[];
  ShortCalls: boolean;
  MaxCallList: number;
  DefaultAlertsDelay: number;
  MinOffset: number;
  MaxOffset: number;
  EnableHuntingBlip: boolean;
  Position: string;
  Debug: boolean;
}

export interface AdminMeta {
  readonly: {
    keybinds: Record<string, string | undefined>;
    weaponWhitelist: string[];
  };
  positions: string[];
  resource: string;
}

export interface AdminConfig {
  settings: AdminSettings;
  DefaultAlerts: Record<string, boolean>;
  JobMapping: Record<string, string[]>;
  Blips: Record<string, BlipDef>;
  Locations: {
    HuntingZones?: HuntingZone[];
    NoDispatchZones?: NoDispatchZone[];
    [key: string]: unknown;
  };
  alerts: Record<string, AlertDef>;
  meta: AdminMeta;
}

export interface SaveResult {
  success: boolean;
  config?: AdminConfig;
  error?: string;
}
