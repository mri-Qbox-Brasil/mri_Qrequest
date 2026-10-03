import {
  MriCard,
  MriCardContent,
  MriNumberInput,
  MriSelect,
  MriSettingField,
  MriSettingToggle,
  MriInput,
  MriBadge,
} from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { AdminConfig, AdminSettings } from "../../types/admin";

interface TabProps {
  config: AdminConfig;
  update: (patch: Partial<AdminConfig>) => void;
}

const NUMERIC: Array<{ key: keyof AdminSettings; min: number; max: number; step: number }> = [
  { key: "DefaultTimeout", min: 1000, max: 120000, step: 500 },
  { key: "AlertTime", min: 1, max: 120, step: 1 },
  { key: "MaxCallList", min: 1, max: 200, step: 1 },
  { key: "DefaultAlertsDelay", min: 0, max: 120, step: 1 },
  { key: "MinOffset", min: 0, max: 1000, step: 1 },
  { key: "MaxOffset", min: 0, max: 1000, step: 1 },
];

const BOOLS: Array<{ key: keyof AdminSettings; desc?: boolean }> = [
  { key: "OnDutyOnly", desc: true },
  { key: "PhoneRequired", desc: true },
  { key: "ShortCalls", desc: true },
  { key: "EnableHuntingBlip" },
  { key: "Debug" },
];

const GeneralTab: React.FC<TabProps> = ({ config, update }) => {
  const { t } = useI18n();
  const s = config.settings;

  const setSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    update({ settings: { ...s, [key]: value } });
  };

  const setDefaultAlert = (key: string, value: boolean) => {
    update({ DefaultAlerts: { ...config.DefaultAlerts, [key]: value } });
  };

  return (
    <div className="space-y-5">
      <MriCard>
        <MriCardContent className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("general.section_timing")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {NUMERIC.map(({ key, min, max, step }) => (
              <MriSettingField key={key} label={t(`general.${key}`)} layout="inline">
                <MriNumberInput
                  value={Number(s[key]) || 0}
                  onChange={(v) => setSetting(key, v as AdminSettings[typeof key])}
                  min={min}
                  max={max}
                  step={step}
                />
              </MriSettingField>
            ))}
            <MriSettingField label={t("general.Position")} layout="inline">
              <MriSelect
                options={config.meta.positions.map((p) => ({ label: p, value: p }))}
                value={s.Position}
                onChange={(v) => setSetting("Position", v)}
              />
            </MriSettingField>
          </div>

          <MriSettingField label={t("general.PhoneItems")}>
            <MriInput
              value={(s.PhoneItems || []).join(", ")}
              onChange={(e) =>
                setSetting(
                  "PhoneItems",
                  e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                )
              }
              placeholder="phone, iphone"
            />
          </MriSettingField>
        </MriCardContent>
      </MriCard>

      <MriCard>
        <MriCardContent className="space-y-2 pt-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("general.section_gating")}
          </h2>
          {BOOLS.map(({ key, desc }) => (
            <MriSettingToggle
              key={key}
              label={t(`general.${key}`)}
              description={desc ? t(`general.${key}_desc`) : undefined}
              checked={Boolean(s[key])}
              onCheckedChange={(v) => setSetting(key, v as AdminSettings[typeof key])}
            />
          ))}
        </MriCardContent>
      </MriCard>

      <MriCard>
        <MriCardContent className="space-y-2 pt-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Default automatic alerts</h2>
          {Object.keys(config.DefaultAlerts).map((key) => (
            <MriSettingToggle
              key={key}
              label={key}
              checked={config.DefaultAlerts[key]}
              onCheckedChange={(v) => setDefaultAlert(key, v)}
            />
          ))}
        </MriCardContent>
      </MriCard>

      <MriCard>
        <MriCardContent className="space-y-3 pt-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("general.section_readonly")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("general.readonly_note")}</p>
          <div>
            <p className="mb-1 text-xs font-medium">{t("general.readonly_keybinds")}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(config.meta.readonly.keybinds).map(([k, v]) => (
                <MriBadge key={k} variant="outline">
                  {k}: {v ?? "—"}
                </MriBadge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">{t("general.readonly_weapons")}</p>
            <div className="flex flex-wrap gap-1.5">
              {config.meta.readonly.weaponWhitelist.map((w) => (
                <MriBadge key={w} variant="secondary" className="text-[10px]">
                  {w}
                </MriBadge>
              ))}
            </div>
          </div>
        </MriCardContent>
      </MriCard>
    </div>
  );
};

export default GeneralTab;
