import { useState } from "react";
import {
  MriCard,
  MriCardContent,
  MriButton,
  MriInput,
  MriNumberInput,
  MriSettingField,
  MriSettingToggle,
} from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { AdminConfig, BlipDef } from "../../types/admin";

interface TabProps {
  config: AdminConfig;
  update: (patch: Partial<AdminConfig>) => void;
}

const DEFAULT_BLIP: BlipDef = {
  radius: 0,
  sprite: 161,
  color: 1,
  scale: 1.5,
  length: 2,
  offset: false,
  flash: false,
};

const BlipsTab: React.FC<TabProps> = ({ config, update }) => {
  const { t } = useI18n();
  const blips = config.Blips;
  const [newKey, setNewKey] = useState("");

  const commit = (next: Record<string, BlipDef>) => update({ Blips: next });

  const patchBlip = (key: string, p: Partial<BlipDef>) => {
    commit({ ...blips, [key]: { ...blips[key], ...p } });
  };

  const addBlip = () => {
    const k = newKey.trim();
    if (!k || blips[k]) return;
    commit({ ...blips, [k]: { ...DEFAULT_BLIP } });
    setNewKey("");
  };

  const removeBlip = (key: string) => {
    const next = { ...blips };
    delete next[key];
    commit(next);
  };

  const NUM: Array<{
    field: keyof BlipDef;
    label: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { field: "sprite", label: t("blips.sprite"), min: 0, max: 900, step: 1 },
    { field: "color", label: t("blips.color"), min: 0, max: 85, step: 1 },
    { field: "scale", label: t("blips.scale"), min: 0, max: 5, step: 0.1 },
    { field: "radius", label: t("blips.radius"), min: 0, max: 1000, step: 5 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("blips.desc")}</p>

      <div className="flex items-center gap-2">
        <MriInput
          className="w-64"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBlip()}
          placeholder={t("blips.for_alert")}
        />
        <MriButton variant="default" size="sm" onClick={addBlip}>
          + {t("blips.add")}
        </MriButton>
      </div>

      {Object.keys(blips).length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("blips.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Object.keys(blips)
            .sort()
            .map((key) => {
              const b = blips[key];
              return (
                <MriCard key={key}>
                  <MriCardContent className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">{key}</span>
                      <MriButton variant="ghost" size="sm" onClick={() => removeBlip(key)}>
                        <span className="text-destructive">{t("common.remove")}</span>
                      </MriButton>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {NUM.map(({ field, label, min, max, step }) => (
                        <MriSettingField key={field} label={label} layout="inline">
                          <MriNumberInput
                            value={Number(b[field]) || 0}
                            onChange={(v) => patchBlip(key, { [field]: v })}
                            min={min}
                            max={max}
                            step={step}
                          />
                        </MriSettingField>
                      ))}
                    </div>
                    <MriSettingToggle
                      label={t("blips.flash")}
                      checked={Boolean(b.flash)}
                      onCheckedChange={(v) => patchBlip(key, { flash: v })}
                    />
                    <MriSettingToggle
                      label={t("blips.offset")}
                      checked={Boolean(b.offset)}
                      onCheckedChange={(v) => patchBlip(key, { offset: v })}
                    />
                  </MriCardContent>
                </MriCard>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default BlipsTab;
