import { useMemo, useState } from "react";
import {
  MriButton,
  MriInput,
  MriBadge,
  MriTable,
  MriTableBody,
  MriTableCell,
  MriTableHead,
  MriTableHeader,
  MriTableRow,
} from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { AdminConfig, AlertDef } from "../../types/admin";
import { Icon } from "../atoms/Icon";
import AlertForm from "./AlertForm";
import { ConfirmDialog } from "./AdminModal";

interface TabProps {
  config: AdminConfig;
  update: (patch: Partial<AdminConfig>) => void;
}

type Editing = { key?: string; def?: AlertDef } | null;

const PRIORITY_VARIANT = ["destructive", "default", "secondary"] as const;

const AlertsTab: React.FC<TabProps> = ({ config, update }) => {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const groups = useMemo(() => Object.keys(config.JobMapping), [config.JobMapping]);
  const keys = useMemo(() => Object.keys(config.alerts), [config.alerts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keys
      .filter(
        (k) => !q || k.toLowerCase().includes(q) || config.alerts[k].code.toLowerCase().includes(q),
      )
      .sort();
  }, [keys, query, config.alerts]);

  const saveAlert = (key: string, def: AlertDef) => {
    update({ alerts: { ...config.alerts, [key]: def } });
    setEditing(null);
  };

  const deleteAlert = (key: string) => {
    const next = { ...config.alerts };
    delete next[key];
    update({ alerts: next });
    setConfirmKey(null);
  };

  const duplicateAlert = (key: string) => {
    let copy = `${key}_copy`;
    let i = 2;
    while (config.alerts[copy]) copy = `${key}_copy${i++}`;
    update({
      alerts: { ...config.alerts, [copy]: JSON.parse(JSON.stringify(config.alerts[key])) },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MriInput
            className="w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("alerts.search")}
          />
          <span className="text-xs text-muted-foreground">
            {filtered.length} {t("alerts.count")}
          </span>
        </div>
        <MriButton variant="default" size="sm" onClick={() => setEditing({})}>
          + {t("alerts.new")}
        </MriButton>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {t("alerts.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <MriTable>
            <MriTableHeader>
              <MriTableRow>
                <MriTableHead>{t("alerts.col_key")}</MriTableHead>
                <MriTableHead>{t("alerts.col_code")}</MriTableHead>
                <MriTableHead>{t("alerts.col_priority")}</MriTableHead>
                <MriTableHead>{t("alerts.col_groups")}</MriTableHead>
                <MriTableHead>{t("alerts.col_flags")}</MriTableHead>
                <MriTableHead className="text-right">{t("alerts.col_actions")}</MriTableHead>
              </MriTableRow>
            </MriTableHeader>
            <MriTableBody>
              {filtered.map((key) => {
                const a = config.alerts[key];
                const flags = (["vehicle", "gender", "weapon", "unit"] as const).filter(
                  (f) => a[f],
                );
                return (
                  <MriTableRow key={key}>
                    <MriTableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Icon name={a.icon} className="text-muted-foreground" />
                        {key}
                      </span>
                    </MriTableCell>
                    <MriTableCell className="text-muted-foreground">{a.code}</MriTableCell>
                    <MriTableCell>
                      <MriBadge variant={PRIORITY_VARIANT[a.priority - 1] ?? "secondary"}>
                        {t(`alertform.priority_${a.priority}`)}
                      </MriBadge>
                    </MriTableCell>
                    <MriTableCell>
                      <span className="flex flex-wrap gap-1">
                        {a.groups.map((g) => (
                          <MriBadge key={g} variant="outline" className="text-[10px]">
                            {g}
                          </MriBadge>
                        ))}
                      </span>
                    </MriTableCell>
                    <MriTableCell className="text-xs text-muted-foreground">
                      {flags.join(", ") || "—"}
                    </MriTableCell>
                    <MriTableCell className="text-right">
                      <span className="flex justify-end gap-1">
                        <MriButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing({ key, def: a })}
                        >
                          {t("alerts.edit")}
                        </MriButton>
                        <MriButton variant="ghost" size="sm" onClick={() => duplicateAlert(key)}>
                          {t("alerts.duplicate")}
                        </MriButton>
                        <MriButton variant="ghost" size="sm" onClick={() => setConfirmKey(key)}>
                          <span className="text-destructive">{t("alerts.delete")}</span>
                        </MriButton>
                      </span>
                    </MriTableCell>
                  </MriTableRow>
                );
              })}
            </MriTableBody>
          </MriTable>
        </div>
      )}

      {editing && (
        <AlertForm
          editKey={editing.key}
          initial={editing.def}
          existingKeys={keys}
          groups={groups}
          onSave={saveAlert}
          onCancel={() => setEditing(null)}
        />
      )}

      {confirmKey && (
        <ConfirmDialog
          message={t("alerts.delete_confirm").replace("%s", confirmKey)}
          confirmLabel={t("alerts.delete")}
          destructive
          onConfirm={() => deleteAlert(confirmKey)}
          onCancel={() => setConfirmKey(null)}
        />
      )}
    </div>
  );
};

export default AlertsTab;
