import { useCallback, useEffect, useMemo, useState } from "react";
import { MriButton, MriTabs, MriBadge, MriTabletFrame, MriDashboardLayout } from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { useAdminConfig } from "../../hooks/useAdminConfig";
import { usePluginBridgeGuest } from "../../plugin/usePluginBridgeGuest";
import { fetchNui } from "../../utils/fetchNui";
import { isEnvBrowser } from "../../utils/misc";
import { AdminConfig } from "../../types/admin";
import GeneralTab from "./GeneralTab";
import AlertsTab from "./AlertsTab";
import JobsTab from "./JobsTab";
import BlipsTab from "./BlipsTab";
import ZonesTab from "./ZonesTab";
import { ConfirmDialog } from "./AdminModal";

interface AdminPanelProps {
  embedded: boolean;
  onClose: () => void;
}

// Converte um hex (#rrggbb) para a string HSL "h s% l%" que os tokens do
// ui-kit (--primary) usam. Retorna null se o hex for inválido.
function hexToHslString(hex: string): string | null {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

type StatusKind = "idle" | "saving" | "ok" | "error";

const AdminPanel: React.FC<AdminPanelProps> = ({ embedded, onClose }) => {
  const { t, setLocale } = useI18n();
  const { config, loading, error, refresh, save, reset } = useAdminConfig();
  const bridge = usePluginBridgeGuest();

  const [route, setRoute] = useState("general");
  const [draft, setDraft] = useState<AdminConfig | null>(null);
  const [status, setStatus] = useState<StatusKind>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  // Painel admin é dark full-screen; ativa o tema escuro do kit enquanto montado.
  useEffect(() => {
    const el = document.documentElement;
    const had = el.classList.contains("dark");
    el.classList.add("dark");
    return () => {
      if (!had) el.classList.remove("dark");
    };
  }, []);

  // Embedded: herda locale e accent do host (mri_Qadmin).
  useEffect(() => {
    if (bridge.initialized) setLocale(bridge.locale);
  }, [bridge.initialized, bridge.locale, setLocale]);

  useEffect(() => {
    if (!bridge.accentColor) return;
    const hsl = hexToHslString(bridge.accentColor);
    if (hsl) document.documentElement.style.setProperty("--primary", hsl);
  }, [bridge.accentColor]);

  // Working copy: clona o config carregado sempre que ele muda de identidade.
  useEffect(() => {
    if (config) setDraft(JSON.parse(JSON.stringify(config)) as AdminConfig);
  }, [config]);

  const dirty = useMemo(
    () => !!draft && !!config && JSON.stringify(draft) !== JSON.stringify(config),
    [draft, config],
  );

  const update = useCallback((patch: Partial<AdminConfig>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setStatus("idle");
  }, []);

  const handleClose = useCallback(() => {
    if (embedded) {
      bridge.requestClose();
    } else {
      if (!isEnvBrowser()) fetchNui("adminClose");
      onClose();
    }
  }, [embedded, bridge, onClose]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setStatus("saving");
    const res = await save(draft);
    if (res.success) {
      setStatus("ok");
      setStatusMsg(t("admin.saved"));
    } else {
      setStatus("error");
      setStatusMsg(res.error || t("admin.save_failed"));
    }
  }, [draft, save, t]);

  const handleReset = useCallback(async () => {
    setConfirmReset(false);
    setStatus("saving");
    const res = await reset();
    if (res.success) {
      setStatus("ok");
      setStatusMsg(t("admin.reverted"));
    } else {
      setStatus("error");
      setStatusMsg(res.error || t("admin.save_failed"));
    }
  }, [reset, t]);

  const tabs = useMemo(
    () => [
      { label: t("admin.tab.general"), route: "general" },
      { label: t("admin.tab.alerts"), route: "alerts" },
      { label: t("admin.tab.jobs"), route: "jobs" },
      { label: t("admin.tab.blips"), route: "blips" },
      { label: t("admin.tab.zones"), route: "zones" },
    ],
    [t],
  );

  // Tabs no slot `subnav` do MriDashboardLayout (topo), com as ações globais
  // (unsaved/status/reverter/salvar/fechar) no rightContent — mesmo padrão do
  // mri_Qspawn. Fica dentro do frame, longe da chrome do FiveM.
  const subnav = (
    <MriTabs
      items={tabs}
      activeRoute={route}
      onNavigate={setRoute}
      rightContent={
        <div className="flex items-center gap-2">
          {dirty && <MriBadge variant="secondary">{t("admin.unsaved")}</MriBadge>}
          {status === "ok" && <span className="text-xs text-primary">{statusMsg}</span>}
          {status === "error" && <span className="text-xs text-destructive">{statusMsg}</span>}
          <MriButton variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
            {t("admin.revert")}
          </MriButton>
          <MriButton
            variant="default"
            size="sm"
            onClick={handleSave}
            isLoading={status === "saving"}
            disabled={!dirty || status === "saving"}
          >
            {status === "saving" ? t("admin.saving") : t("admin.save")}
          </MriButton>
          <MriButton variant="ghost" size="sm" onClick={handleClose}>
            {t("admin.close")}
          </MriButton>
        </div>
      }
    />
  );

  // Cabeçalho de página (dentro do conteúdo, abaixo das tabs) — igual ao
  // "Gerenciar Spawns" do Qspawn.
  const pageHeader = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <i className="fa fa-tower-broadcast text-xl" />
      </div>
      <div>
        <h1 className="text-lg font-bold leading-tight">{t("admin.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("admin.subtitle")}</p>
      </div>
    </div>
  );

  const content =
    loading || !draft ? (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <span>{error ? t("admin.load_failed") : t("admin.loading")}</span>
        {error && (
          <MriButton variant="outline" size="sm" onClick={refresh}>
            {t("admin.retry")}
          </MriButton>
        )}
      </div>
    ) : (
      <div className="space-y-6">
        {pageHeader}
        {route === "general" && <GeneralTab config={draft} update={update} />}
        {route === "alerts" && <AlertsTab config={draft} update={update} />}
        {route === "jobs" && <JobsTab config={draft} update={update} />}
        {route === "blips" && <BlipsTab config={draft} update={update} />}
        {route === "zones" && <ZonesTab config={draft} update={update} />}
      </div>
    );

  const dashboard = (
    <MriDashboardLayout subnav={subnav} mainClassName="overflow-y-auto">
      {content}
    </MriDashboardLayout>
  );

  const overlays = confirmReset && (
    <ConfirmDialog
      message={t("admin.revert_confirm")}
      confirmLabel={t("admin.revert")}
      destructive
      onConfirm={handleReset}
      onCancel={() => setConfirmReset(false)}
    />
  );

  // Embedded (mri_Qadmin): o host já provê o frame externo — renderiza o
  // dashboard direto. Standalone: envolve no MriTabletFrame (frame centralizado
  // e delimitado, não edge-to-edge).
  if (embedded) {
    return (
      <div className="h-full w-full bg-background text-foreground">
        {dashboard}
        {overlays}
      </div>
    );
  }

  return (
    <MriTabletFrame size="lg">
      <div className="flex h-full w-full">{dashboard}</div>
      {overlays}
    </MriTabletFrame>
  );
};

export default AdminPanel;
