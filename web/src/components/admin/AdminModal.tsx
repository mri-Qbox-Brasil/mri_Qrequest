import { useEffect } from "react";
import { MriButton } from "@mriqbox/ui-kit";
import { cn } from "../../utils/cn";
import { useI18n } from "../../i18n";

// Modal próprio (div fixa + card centralizado). Evitamos MriModal/janelas nativas
// (window.confirm/alert/prompt) porque no CEF do FiveM as janelas nativas não
// aparecem e algumas animações de entrada ficam invisíveis. Isto sempre pinta.

interface AdminModalProps {
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const AdminModal: React.FC<AdminModalProps> = ({ onClose, className, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-xl border border-border bg-card text-foreground shadow-2xl",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  destructive,
}) => {
  const { t } = useI18n();
  return (
    <AdminModal onClose={onCancel} className="max-w-md">
      <div className="p-6">
        <p className="text-sm">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <MriButton variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </MriButton>
          <MriButton variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel ?? t("common.confirm")}
          </MriButton>
        </div>
      </div>
    </AdminModal>
  );
};
