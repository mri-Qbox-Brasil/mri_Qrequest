import { useCallback, useEffect, useState } from "react";
import { fetchNui } from "../utils/fetchNui";
import { isEnvBrowser } from "../utils/misc";
import { useNuiEvent } from "./useNuiEvent";
import { AdminConfig, SaveResult } from "../types/admin";

// Mock usado no browser (dev) — permite abrir o painel sem o jogo.
const MOCK: AdminConfig = {
  settings: {
    DefaultTimeout: 15000,
    AlertTime: 5,
    OnDutyOnly: true,
    PhoneRequired: true,
    PhoneItems: ["phone"],
    ShortCalls: false,
    MaxCallList: 25,
    DefaultAlertsDelay: 5,
    MinOffset: 1,
    MaxOffset: 120,
    EnableHuntingBlip: false,
    Position: "top-right",
    Debug: false,
  },
  DefaultAlerts: {
    Speeding: true,
    Shooting: true,
    Autotheft: true,
    Melee: true,
    PlayerDowned: true,
    Explosion: true,
  },
  JobMapping: {
    leo: ["police", "sheriff", "trooper"],
    ems: ["ambulance", "medic"],
    mechanic: ["mechanic"],
  },
  Blips: {
    shooting: {
      radius: 0,
      sprite: 110,
      color: 1,
      scale: 1.5,
      length: 2,
      sound: "Lose_1st",
      sound2: "GTAO_FM_Events_Soundset",
      offset: false,
      flash: false,
    },
    speeding: {
      radius: 0,
      sprite: 326,
      color: 84,
      scale: 1.5,
      length: 2,
      offset: false,
      flash: false,
    },
  },
  Locations: {
    HuntingZones: [
      { label: "Hunting Zone", radius: 650, coords: { x: -938.61, y: 4823.99, z: 313.92 } },
    ],
    NoDispatchZones: [
      {
        label: "Ammunation 1",
        coords: { x: 13.53, y: -1097.92, z: 29.8 },
        length: 14,
        width: 5,
        heading: 70,
        minZ: 28.8,
        maxZ: 32.8,
      },
    ],
  },
  alerts: {
    shooting: {
      code: "10-71",
      icon: "crosshairs",
      priority: 2,
      groups: ["leo"],
      tag: "tiros",
      gender: true,
      weapon: true,
    },
    speeding: {
      code: "10-94",
      icon: "gauge-high",
      priority: 2,
      groups: ["leo"],
      tag: "transito",
      vehicle: true,
    },
    officerdown: {
      code: "10-13",
      icon: "skull",
      priority: 1,
      groups: ["leo", "ems"],
      tag: "urgente",
      unit: true,
      alertTime: 10,
    },
    civdown: {
      code: "10-69",
      icon: "face-dizzy",
      priority: 1,
      groups: ["ems"],
      tag: "medico",
      gender: true,
      alertTime: 10,
    },
  },
  meta: {
    readonly: {
      keybinds: { OpenSettingsKey: "F3", OpenDispatchMenu: "F2", AcceptKey: "Y", DenyKey: "N" },
      weaponWhitelist: ["WEAPON_GRENADE", "WEAPON_MOLOTOV", "WEAPON_STICKYBOMB"],
    },
    positions: ["top-right", "top-left", "bottom-right", "bottom-left"],
    resource: "g5-request",
  },
};

interface UseAdminConfigResult {
  config: AdminConfig | null;
  loading: boolean;
  error: boolean;
  /** Substitui todo o snapshot (ex: após um init/snapshot externo). */
  setConfig: (c: AdminConfig) => void;
  save: (payload: Partial<AdminConfig>) => Promise<SaveResult>;
  reset: () => Promise<SaveResult>;
  refresh: () => void;
}

export function useAdminConfig(): UseAdminConfigResult {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const hydrate = useCallback((c: AdminConfig | null | undefined) => {
    if (c && c.settings) {
      setConfig(c);
      setLoading(false);
      setError(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (isEnvBrowser()) {
      hydrate(MOCK);
      return;
    }
    setLoading(true);
    setError(false);
    // Timeout de segurança: se o callback do client nunca chamar cb (ex: o
    // callback do server não respondeu), não trava o painel no spinner —
    // mostra erro + retry em vez de carregar pra sempre.
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        setLoading(false);
        setError(true);
      }
    }, 8000);
    fetchNui<AdminConfig>("adminGetConfig", {}, MOCK)
      .then((c) => {
        settled = true;
        clearTimeout(timer);
        if (c && c.settings) hydrate(c);
        else {
          setLoading(false);
          setError(true);
        }
      })
      .catch(() => {
        settled = true;
        clearTimeout(timer);
        setLoading(false);
        setError(true);
      });
  }, [hydrate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Snapshot empurrado pelo comando (openAdmin) e pelo broadcast configChanged.
  useNuiEvent<AdminConfig | undefined>("openAdmin", (data) => {
    if (data) hydrate(data);
    else refresh();
  });
  useNuiEvent<AdminConfig>("updateAdminConfig", hydrate);

  const save = useCallback(
    async (payload: Partial<AdminConfig>): Promise<SaveResult> => {
      if (isEnvBrowser()) {
        setConfig((prev) => (prev ? { ...prev, ...payload } : prev));
        return { success: true };
      }
      const res = await fetchNui<SaveResult>("adminSaveConfig", payload, { success: true });
      if (res.success && res.config) hydrate(res.config);
      return res;
    },
    [hydrate],
  );

  const reset = useCallback(async (): Promise<SaveResult> => {
    if (isEnvBrowser()) {
      hydrate(MOCK);
      return { success: true };
    }
    const res = await fetchNui<SaveResult>("adminResetConfig", {}, { success: true });
    if (res.success && res.config) hydrate(res.config);
    return res;
  }, [hydrate]);

  return { config, loading, error, setConfig, save, reset, refresh };
}
