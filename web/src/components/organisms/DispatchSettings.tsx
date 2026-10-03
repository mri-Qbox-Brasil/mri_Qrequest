import React from "react";
import { MriInput, MriSettingToggle } from "@mriqbox/ui-kit";
import { Icon } from "../atoms/Icon";
import { useI18n } from "../../i18n";

type DispatchSettingsProps = {
  isMuted: boolean;
  onToggleMute: (val: boolean) => void;
  shortMode: boolean;
  onToggleShortMode: (val: boolean) => void;
  keepRequestsOpen: boolean;
  onToggleKeepRequestsOpen: (val: boolean) => void;
  callsign: string;
  setCallsign: (val: string) => void;
};

export const DispatchSettings: React.FC<DispatchSettingsProps> = ({
  isMuted,
  onToggleMute,
  shortMode,
  onToggleShortMode,
  keepRequestsOpen,
  onToggleKeepRequestsOpen,
  callsign,
  setCallsign,
}) => {
  const { t } = useI18n();

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Callsign */}
      <div className="space-y-3">
        <div>
          <div className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Icon name="user-tag" />
            {t("settings.callsign")}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("settings.callsign_desc")}</p>
        </div>
        <MriInput
          value={callsign}
          onChange={(e) => setCallsign(e.target.value.toUpperCase())}
          placeholder={t("settings.callsign_placeholder")}
          className="h-12 text-base uppercase font-mono tracking-wider"
        />
      </div>

      <div className="h-px bg-border" />

      {/* Toggles */}
      <div className="space-y-1">
        <MriSettingToggle
          label={t("settings.mute")}
          description={t("settings.mute_desc")}
          checked={isMuted}
          onCheckedChange={onToggleMute}
          icon={<Icon name={isMuted ? "bell-slash" : "bell"} />}
        />
        <MriSettingToggle
          label={t("settings.compact")}
          description={t("settings.compact_desc")}
          checked={shortMode}
          onCheckedChange={onToggleShortMode}
          icon={<Icon name="compress" />}
        />
        <MriSettingToggle
          label={t("settings.keep_open")}
          description={t("settings.keep_open_desc")}
          checked={keepRequestsOpen}
          onCheckedChange={onToggleKeepRequestsOpen}
          icon={<Icon name="layer-group" />}
        />
      </div>
    </div>
  );
};
