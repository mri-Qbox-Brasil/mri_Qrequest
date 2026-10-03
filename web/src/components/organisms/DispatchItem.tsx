import React from "react";
import { RequestData } from "../../types";
import { RequestHeader } from "../molecules/RequestHeader";
import { RequestExtras } from "../molecules/RequestExtras";
import { ExpirationTimer } from "../molecules/ExpirationTimer";
import { ActionBtn } from "../molecules/RequestActions";
import { VehicleInfo } from "../molecules/VehicleInfo";
import { RespondingUnits } from "../molecules/RespondingUnits";
import { useI18n } from "../../i18n";

export type HistoryItem = {
  id: string;
  data: RequestData;
  time: number;
};

type DispatchItemProps = {
  item: HistoryItem;
  onLocate: (req: RequestData) => void;
  onAccept: (item: HistoryItem) => void;
  onDeny: (item: HistoryItem) => void;
  onDetach: (item: HistoryItem) => void;
  myCallsign?: string;
};

export const DispatchItem: React.FC<DispatchItemProps> = ({
  item,
  onLocate,
  onAccept,
  onDeny,
  onDetach,
  myCallsign,
}) => {
  const req = item.data;
  const { t } = useI18n();

  // O jogador local está "a caminho" quando seu callsign está entre as unidades.
  const isAttached =
    !!myCallsign && !!req.units?.some((u) => u.callsign === myCallsign);

  const extras = req.extras as Record<string, unknown> | undefined;
  const hasCoords = extras?.x !== undefined && extras?.y !== undefined;

  return (
    <div className="group flex items-center justify-between p-2 border-l-2 border-transparent border-b border-border transition-colors hover:bg-muted/50 hover:border-l-primary last:border-b-0">
      <div className="flex items-start flex-1">
        <div className="space-y-1 w-auto">
          <div className="flex items-center gap-2">
            <RequestHeader req={req} />
          </div>

          <RequestExtras extras={req.extras} />
          <VehicleInfo vehicle={req.vehicle} />

          <div className="mt-1">
            <RespondingUnits units={req.units} />
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono pt-1">
            <span>{new Date(item.time).toLocaleTimeString()}</span>
            <ExpirationTimer
              startTime={item.time}
              expiresIn={
                req.expiresIn || (req.timeout === req.expiresIn ? req.timeout : req.expiresIn)
              }
            />
          </div>
        </div>
      </div>

      <div className="p-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasCoords && (
          <ActionBtn
            variant="locate"
            onClick={() => onLocate(req)}
            icon="map-marker"
            title={t("menu.locate_title")}
          />
        )}

        {isAttached ? (
          <ActionBtn
            variant="deny"
            onClick={() => onDetach(item)}
            icon="right-from-bracket"
            label={t("menu.enroute")}
            title={t("menu.enroute_title")}
          />
        ) : (
          <ActionBtn
            variant="accept"
            onClick={() => onAccept(item)}
            label={req.acceptText ?? t("action.accept")}
            title={t("action.accept")}
          />
        )}

        {!req.hideDeny && (
          <ActionBtn
            variant="deny"
            onClick={() => onDeny(item)}
            label={req.denyText ?? t("action.deny")}
            title={t("action.deny")}
          />
        )}
      </div>
    </div>
  );
};
