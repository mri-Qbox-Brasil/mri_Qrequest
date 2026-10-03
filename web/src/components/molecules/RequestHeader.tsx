import React from "react";
import { MriBadge } from "@mriqbox/ui-kit";
import { Icon } from "../atoms/Icon";
import { esc, getContrastColor } from "../../utils/themeUtils";
import { RequestData } from "../../types";
import { useTheme } from "../../contexts/ThemeContext";

type RequestHeaderProps = {
  req: RequestData;
};

export const RequestHeader: React.FC<RequestHeaderProps> = ({ req }) => {
  const { themes } = useTheme();

  const themeType = req.themeType || "default";
  const cardTheme = themes[themeType] || themes["default"];

  // Cores funcionais vindas do servidor (mantidas). Sem cor → token do kit.
  const tagBg = req.tagColor || cardTheme?.tag_bg;
  const tagFg = req.tagColor
    ? getContrastColor(req.tagColor)
    : cardTheme?.tag_fg || (tagBg ? getContrastColor(tagBg) : undefined);

  const codeBg = req.codeColor || cardTheme?.code_bg;
  const codeFg = req.codeColor
    ? getContrastColor(req.codeColor)
    : cardTheme?.code_fg || (codeBg ? getContrastColor(codeBg) : undefined);

  const badgeClass =
    "rounded-[4px] px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider border-0 whitespace-nowrap";

  return (
    <div className="flex items-center gap-2">
      {req.titleIcon && (
        <Icon
          name={req.titleIcon}
          className="text-xs"
          style={{ color: req.titleIconColor || undefined }}
        />
      )}

      {req.code &&
        (codeBg ? (
          <MriBadge
            className={badgeClass}
            style={{ backgroundColor: codeBg, color: codeFg || "#fff" }}
          >
            {esc(req.code)}
          </MriBadge>
        ) : (
          <MriBadge variant="secondary" className={badgeClass}>
            {esc(req.code)}
          </MriBadge>
        ))}

      {(req.tagText || req.tag) &&
        (tagBg ? (
          <MriBadge
            className={badgeClass}
            style={{ backgroundColor: tagBg, color: tagFg || "#fff" }}
          >
            {esc(req.tagText || undefined) || `#${esc(req.tag || undefined)}`}
          </MriBadge>
        ) : (
          <MriBadge variant="secondary" className={badgeClass}>
            {esc(req.tagText || undefined) || `#${esc(req.tag || undefined)}`}
          </MriBadge>
        ))}

      <span className="font-bold text-xs text-foreground leading-none truncate max-w-[180px]">
        {esc(req.title || undefined)}
      </span>
    </div>
  );
};
