import React from "react";
import { MriBadge } from "@mriqbox/ui-kit";
import { esc } from "../../utils/themeUtils";
import { Icon } from "../atoms/Icon";

type RequestExtrasProps = {
  extras: unknown;
};

interface ExtraDetailed {
  icon?: string;
  name?: string;
  value: unknown;
}

const EXTRA_BADGE_CLASS =
  "text-[10px] min-h-[20px] h-auto py-0.5 gap-1.5 font-normal whitespace-normal break-all text-left";

export const RequestExtras: React.FC<RequestExtrasProps> = ({ extras }) => {
  if (!extras) return null;

  let extrasObj: unknown = null;
  try {
    extrasObj = typeof extras === "string" ? JSON.parse(extras) : extras;
  } catch (e) {
    extrasObj = null;
  }

  const renderSimpleItem = (
    icon: string | undefined,
    name: string | undefined,
    value: unknown,
    idx: number | string,
  ) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <MriBadge variant="secondary" className={EXTRA_BADGE_CLASS} key={idx}>
        <Icon name={icon} />
        <span className="font-semibold text-foreground whitespace-nowrap">{esc(name || "")}:</span>
        <span className="text-muted-foreground">{esc(String(value))}</span>
      </MriBadge>
    );
  };

  if (Array.isArray(extrasObj)) {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {(extrasObj as unknown[]).map((item, idx) => {
          if (!item || typeof item !== "object") return null;
          const { icon, name, value } = item as ExtraDetailed;
          return renderSimpleItem(icon, name, value, idx);
        })}
      </div>
    );
  }

  if (extrasObj && typeof extrasObj === "object") {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {Object.entries(extrasObj as Record<string, unknown>).map(([k, v], idx) => {
          // Estrutura detalhada {icon, name, value}
          if (v && typeof v === "object" && (v as ExtraDetailed).value !== undefined) {
            const detailed = v as ExtraDetailed;
            return renderSimpleItem(detailed.icon || k, detailed.name || k, detailed.value, idx);
          }

          if (v === null || v === undefined || v === "") return null;
          if (typeof v === "object") return null; // evita [object Object]

          return renderSimpleItem(k, k, v, idx);
        })}
      </div>
    );
  }

  return (
    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
      {esc(typeof extras === "string" ? extras : JSON.stringify(extras))}
    </div>
  );
};
