import React, { useEffect, useState } from "react";
import {
  MriModal,
  MriButton,
  MriSearchInput,
  MriSegmentedTabs,
  MriScrollArea,
} from "@mriqbox/ui-kit";
import { fetchNui } from "../../utils/fetchNui";
import { Icon } from "../atoms/Icon";
import { useI18n } from "../../i18n";
import { RequestData } from "../../types";
import { DispatchItem, HistoryItem } from "./DispatchItem";
import { DispatchSettings } from "./DispatchSettings";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClear: () => void;
  onLocate: (req: RequestData) => void;
  onAccept: (item: HistoryItem) => void;
  onDeny: (item: HistoryItem) => void;
  onDetach: (item: HistoryItem) => void;
  myCallsign?: string;
  // Settings
  isMuted: boolean;
  onToggleMute: (val: boolean) => void;
  shortMode: boolean;
  onToggleShortMode: (val: boolean) => void;
  keepRequestsOpen: boolean;
  onToggleKeepRequestsOpen: (val: boolean) => void;
  callsign: string;
  setCallsign: (val: string) => void;
  initialTab?: "history" | "settings";
};

const DispatchMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  history,
  onClear,
  onLocate,
  onAccept,
  onDeny,
  onDetach,
  myCallsign,
  isMuted,
  onToggleMute,
  shortMode,
  onToggleShortMode,
  keepRequestsOpen,
  onToggleKeepRequestsOpen,
  callsign,
  setCallsign,
  initialTab = "history",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"history" | "settings">("history");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { t } = useI18n();

  const toggleAlerts = () => {
    fetchNui<{ disabled?: boolean }>("toggleAlerts")
      .then((res) => setAlertsEnabled(!(res?.disabled ?? !alertsEnabled)))
      .catch(() => setAlertsEnabled((v) => !v));
  };

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const handleClose = () => {
    fetchNui("close").catch(() => {});
    onClose();
  };

  if (!isOpen) return null;

  const filtered = history
    .filter(
      (h) =>
        h.data.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.data.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.data.tag?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => b.time - a.time);

  return (
    <MriModal
      onClose={handleClose}
      className="w-full max-w-4xl h-[80vh] gap-0 p-0 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4 space-y-3">
        {/* Linha 1: título + abas + fechar */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <div className="flex items-center gap-3 shrink-0">
              <Icon name="list-alt" className="text-lg text-primary" />
              <h2 className="text-xl font-bold tracking-wide text-foreground whitespace-nowrap">
                {t("menu.title")}
              </h2>
            </div>

            <MriSegmentedTabs
              value={activeTab}
              onChange={(id) => setActiveTab(id as "history" | "settings")}
              items={[
                {
                  id: "history",
                  label: (
                    <span>
                      {t("menu.tab_history")}
                      <span className="ml-2 opacity-50 text-[10px]">{history.length}</span>
                    </span>
                  ),
                },
                { id: "settings", label: t("menu.tab_settings") },
              ]}
            />
          </div>

          <MriButton variant="ghost" size="icon" className="shrink-0" onClick={handleClose}>
            <Icon name="times" className="text-lg" />
          </MriButton>
        </div>

        {/* Linha 2: busca + ações (só no histórico) */}
        {activeTab === "history" && (
          <div className="flex items-center gap-2 flex-wrap">
            <MriSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t("menu.search")}
              width="w-48"
              size="sm"
            />
            <div className="flex-1" />
            <MriButton
              variant="secondary"
              size="sm"
              onClick={() => fetchNui("refreshAlerts").catch(() => {})}
              title={t("menu.refresh_title")}
            >
              <Icon name="rotate" /> {t("menu.refresh")}
            </MriButton>
            <MriButton
              variant="secondary"
              size="sm"
              onClick={() => fetchNui("clearBlips").catch(() => {})}
              title={t("menu.clear_blips_title")}
            >
              <Icon name="map-location-dot" /> {t("menu.clear_blips")}
            </MriButton>
            <MriButton
              variant={alertsEnabled ? "secondary" : "destructive"}
              size="sm"
              onClick={toggleAlerts}
              title={t("menu.alerts_title")}
            >
              <Icon name={alertsEnabled ? "bell" : "bell-slash"} />
              {alertsEnabled ? t("menu.alerts_on") : t("menu.alerts_off")}
            </MriButton>
            <MriButton variant="destructive" size="sm" onClick={onClear}>
              {t("menu.clear_all")}
            </MriButton>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {activeTab === "history" ? (
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
              <Icon name="inbox" className="text-4xl mb-4" />
              <p>{t("menu.empty")}</p>
            </div>
          ) : (
            <MriScrollArea className="h-full">
              <div className="space-y-1">
                {filtered.map((item) => (
                  <DispatchItem
                    key={item.id}
                    item={item}
                    onLocate={onLocate}
                    onAccept={onAccept}
                    onDeny={onDeny}
                    onDetach={onDetach}
                    myCallsign={myCallsign}
                  />
                ))}
              </div>
            </MriScrollArea>
          )
        ) : (
          <MriScrollArea className="h-full">
            <DispatchSettings
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              shortMode={shortMode}
              onToggleShortMode={onToggleShortMode}
              keepRequestsOpen={keepRequestsOpen}
              onToggleKeepRequestsOpen={onToggleKeepRequestsOpen}
              callsign={callsign}
              setCallsign={setCallsign}
            />
          </MriScrollArea>
        )}
      </div>
    </MriModal>
  );
};

export default DispatchMenu;
