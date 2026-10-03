import React from "react";
import { Icon } from "../atoms/Icon";
import { useI18n } from "../../i18n";

type Unit = { callsign: string; type?: string };

type RespondingUnitsProps = {
  units?: Unit[];
  /** `true` renderiza cabeçalho + separador (uso no card). `false` só os chips (uso na lista). */
  withLabel?: boolean;
};

/**
 * Lista compacta das unidades a caminho de um chamado. Reaproveitada pelo
 * RequestCard (com cabeçalho) e pelo item da lista do dispatch (só chips).
 */
export const RespondingUnits: React.FC<RespondingUnitsProps> = ({ units, withLabel = false }) => {
  const { t } = useI18n();
  if (!units || units.length === 0) return null;

  const chips = (
    <div className="flex flex-wrap gap-1">
      {units.map((u, i) => (
        <div
          key={i}
          className="flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
        >
          <Icon name="user" className="text-[8px]" />
          {u.callsign}
        </div>
      ))}
    </div>
  );

  if (!withLabel) return chips;

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1 flex items-center gap-1">
        <Icon name="users" />
        <span>{t("card.responding_units")}</span>
      </div>
      {chips}
    </div>
  );
};
