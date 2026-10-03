import React from "react";
import { MriButton } from "@mriqbox/ui-kit";
import { Icon } from "../atoms/Icon";

type ActionVariant = "accept" | "deny" | "locate" | "default";

type ActionButtonProps = {
  onClick: () => void;
  label?: string; // For text buttons (Popup)
  icon?: string; // For icon buttons (History/Row)
  className?: string; // Base class
  variant: ActionVariant;
  shortcutKey?: string;
  title?: string;
};

// Mapeia a semântica de dispatch para as variantes do kit.
const KIT_VARIANT: Record<ActionVariant, "default" | "outline" | "secondary"> = {
  accept: "default", // primary (verde do kit) = ação positiva
  deny: "outline", // neutro/discreto
  locate: "secondary",
  default: "secondary",
};

/**
 * Botão de ação de um request (aceitar / recusar / localizar). Apoiado no
 * `MriButton` do kit; o único adorno próprio é o chip de atalho de teclado.
 */
const ActionBtn: React.FC<ActionButtonProps> = ({
  onClick,
  label,
  icon,
  className,
  variant,
  shortcutKey,
  title,
}) => {
  return (
    <MriButton
      variant={KIT_VARIANT[variant]}
      size="sm"
      onClick={onClick}
      title={title}
      className={className}
    >
      {shortcutKey && (
        <kbd className="flex h-5 w-5 items-center justify-center rounded bg-background/30 text-[10px] font-bold not-italic">
          {shortcutKey}
        </kbd>
      )}
      {icon && <Icon name={icon} />}
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      )}
    </MriButton>
  );
};

export { ActionBtn };
