import React from "react";
import { esc } from "../../utils/themeUtils";

type IconProps = {
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
};

export const Icon: React.FC<IconProps> = ({ name, className, style }) => {
  if (!name) return null;
  return <i className={`fa fa-${esc(name)} ${className || ""}`} style={style} />;
};
