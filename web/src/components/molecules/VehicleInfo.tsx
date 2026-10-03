import React from "react";
import { Icon } from "../atoms/Icon";
import { esc } from "../../utils/themeUtils";
import { useI18n } from "../../i18n";

type VehicleInfoProps = {
  vehicle?: {
    plate: string;
    model: string;
    color?: string;
    class?: string;
  };
};

export const VehicleInfo: React.FC<VehicleInfoProps> = ({ vehicle }) => {
  const { t } = useI18n();
  if (!vehicle) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border space-y-1.5">
      <div className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
        <Icon name="car" />
        <span>{t("card.vehicle_info")}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/40 p-1.5 rounded border border-border">
          <div className="text-[9px] text-muted-foreground uppercase mb-0.5">{t("card.plate")}</div>
          <div className="text-[11px] font-mono font-bold text-foreground tracking-widest">
            {vehicle.plate}
          </div>
        </div>

        <div className="bg-muted/40 p-1.5 rounded border border-border">
          <div className="text-[9px] text-muted-foreground uppercase mb-0.5">{t("card.model")}</div>
          <div className="text-[11px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {esc(vehicle.model)}
          </div>
        </div>
      </div>

      {vehicle.color && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 p-1 rounded">
          <span className="opacity-70">{t("card.color")}:</span>
          <span className="text-foreground">{esc(vehicle.color)}</span>
        </div>
      )}
    </div>
  );
};
