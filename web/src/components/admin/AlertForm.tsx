import { useMemo, useState } from "react";
import {
  MriButton,
  MriInput,
  MriSegmentedTabs,
  MriSettingField,
  MriSettingToggle,
  MriNumberInput,
} from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { AlertDef } from "../../types/admin";
import { Icon } from "../atoms/Icon";
import { AdminModal } from "./AdminModal";

interface AlertFormProps {
  /** Chave em edição (undefined = criando um novo). */
  editKey?: string;
  initial?: AlertDef;
  existingKeys: string[];
  groups: string[];
  onSave: (key: string, def: AlertDef) => void;
  onCancel: () => void;
}

const FLAGS: Array<keyof Pick<AlertDef, "vehicle" | "gender" | "weapon" | "unit">> = [
  "vehicle",
  "gender",
  "weapon",
  "unit",
];

const AlertForm: React.FC<AlertFormProps> = ({
  editKey,
  initial,
  existingKeys,
  groups,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const isNew = editKey === undefined;

  const [key, setKey] = useState(editKey ?? "");
  const [def, setDef] = useState<AlertDef>(
    initial ?? {
      code: "10-",
      icon: "circle-info",
      priority: 2,
      groups: groups[0] ? [groups[0]] : [],
    },
  );
  const [hasCustomTime, setHasCustomTime] = useState(initial?.alertTime !== undefined);
  const [error, setError] = useState("");

  const groupItems = useMemo(() => groups.map((g) => ({ id: g, label: g })), [groups]);

  const patch = (p: Partial<AlertDef>) => setDef((d) => ({ ...d, ...p }));

  const submit = () => {
    const trimmed = key.trim();
    if (!trimmed) return setError(t("alertform.key_required"));
    if (isNew && existingKeys.includes(trimmed)) return setError(t("alertform.key_exists"));
    if (!def.groups || def.groups.length === 0) return setError(t("alertform.groups_required"));

    const finalDef: AlertDef = {
      code: def.code,
      icon: def.icon,
      priority: def.priority,
      groups: def.groups,
      tag: def.tag || undefined,
      vehicle: def.vehicle || undefined,
      gender: def.gender || undefined,
      weapon: def.weapon || undefined,
      unit: def.unit || undefined,
      alertTime: hasCustomTime ? def.alertTime || 10 : undefined,
    };
    onSave(trimmed, finalDef);
  };

  return (
    <AdminModal onClose={onCancel} className="max-w-[560px]">
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <h2 className="mb-4 text-base font-semibold">
          {isNew ? t("alertform.new_title") : t("alertform.edit_title")}
        </h2>

        <div className="space-y-4">
          <MriSettingField label={t("alertform.key")} description={t("alertform.key_hint")}>
            <MriInput
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!isNew}
              placeholder="bankrobbery"
            />
          </MriSettingField>

          <div className="grid grid-cols-2 gap-4">
            <MriSettingField label={t("alertform.code")}>
              <MriInput value={def.code} onChange={(e) => patch({ code: e.target.value })} />
            </MriSettingField>
            <MriSettingField label={t("alertform.icon")}>
              <MriInput
                value={def.icon}
                onChange={(e) => patch({ icon: e.target.value })}
                rightIcon={<Icon name={def.icon} />}
              />
            </MriSettingField>
          </div>

          <MriSettingField label={t("alertform.priority")}>
            <MriSegmentedTabs
              items={[
                { id: "1", label: t("alertform.priority_1") },
                { id: "2", label: t("alertform.priority_2") },
                { id: "3", label: t("alertform.priority_3") },
              ]}
              value={String(def.priority)}
              onChange={(v) => patch({ priority: Number(v) })}
            />
          </MriSettingField>

          <MriSettingField label={t("alertform.groups")}>
            <MriSegmentedTabs
              type="multiple"
              items={groupItems}
              value={def.groups}
              onChange={(ids) => patch({ groups: ids as string[] })}
            />
          </MriSettingField>

          <MriSettingField label={t("alertform.tag")}>
            <MriInput value={def.tag ?? ""} onChange={(e) => patch({ tag: e.target.value })} />
          </MriSettingField>

          <div>
            <p className="mb-2 text-sm font-medium">{t("alertform.flags")}</p>
            <div className="space-y-1">
              {FLAGS.map((flag) => (
                <MriSettingToggle
                  key={flag}
                  label={t(`alertform.flag_${flag}`)}
                  checked={Boolean(def[flag])}
                  onCheckedChange={(v) => patch({ [flag]: v } as Partial<AlertDef>)}
                />
              ))}
            </div>
          </div>

          <MriSettingToggle
            label={t("alertform.alertTime")}
            description={t("alertform.alertTime_hint")}
            checked={hasCustomTime}
            onCheckedChange={setHasCustomTime}
          />
          {hasCustomTime && (
            <MriNumberInput
              value={def.alertTime ?? 10}
              onChange={(v) => patch({ alertTime: v })}
              min={1}
              max={120}
            />
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <MriButton variant="ghost" onClick={onCancel}>
            {t("alertform.cancel")}
          </MriButton>
          <MriButton variant="default" onClick={submit}>
            {t("alertform.save")}
          </MriButton>
        </div>
      </div>
    </AdminModal>
  );
};

export default AlertForm;
