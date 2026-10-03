import React, { useEffect, useRef } from "react";
import { MriCard, MriCardContent, MriCardFooter } from "@mriqbox/ui-kit";
import { useTheme } from "../../contexts/ThemeContext";
import { RequestHeader } from "../molecules/RequestHeader";
import { RequestExtras } from "../molecules/RequestExtras";
import { ActionBtn } from "../molecules/RequestActions";
import { VehicleInfo } from "../molecules/VehicleInfo";
import { RespondingUnits } from "../molecules/RespondingUnits";
import { noop } from "../../utils/misc";
import { RequestData } from "../../types";
import { useI18n } from "../../i18n";

type Props = {
  req: RequestData;
  acceptKey: string;
  denyKey: string;
  onExpire: () => void;
  onRemove: () => void;
  onAccept: () => void;
  flash?: "accept" | "deny" | null;
  shortMode?: boolean;
};

function _hasExtension(name?: string) {
  return !!name && /\.[a-z0-9]{1,6}$/i.test(name);
}

function _audioPathFor(name?: string) {
  if (!name || typeof name !== "string") return [] as string[];
  const clean = name.trim();
  if (clean.length === 0) return [] as string[];
  if (_hasExtension(clean)) {
    return [`assets/sound/${clean}`];
  }
  return [`assets/sound/${clean}.ogg`, `assets/sound/${clean}.mp3`, `assets/sound/${clean}.wav`];
}

const RequestCard: React.FC<Props> = ({
  req,
  acceptKey,
  denyKey,
  onExpire,
  onRemove,
  onAccept,
  flash,
  shortMode,
}) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const playedRef = useRef(false);
  const startedAtRef = useRef<number>(performance.now());
  const durationRef = useRef<number>(req.timeout ?? 8000);
  const rafRef = useRef<number | null>(null);
  const { themes } = useTheme();
  const { t } = useI18n();

  // Mantém os callbacks mais recentes em refs para que o efeito de timer/animação
  // NÃO reinicie a cada render do container (onExpire/onRemove são recriados a
  // cada render). Sem isso, a barra de progresso reiniciava sempre que a lista
  // mudava e os cards nunca expiravam de forma confiável.
  const onExpireRef = useRef(onExpire);
  const onRemoveRef = useRef(onRemove);
  onExpireRef.current = onExpire;
  onRemoveRef.current = onRemove;

  // Cor funcional da barra de progresso (accent do tema ou override do servidor).
  const themeType = req.themeType || "default";
  const cardTheme = themes[themeType] || themes["default"];
  const progressColor = req.progressColor || cardTheme?.progress_color || cardTheme?.accent;

  // Prioridade 1 = alta (destaque vermelho); demais usam o accent do tema.
  const isHighPriority = Number(req.priority) === 1;
  const accentColor = isHighPriority ? "#ef4444" : progressColor;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Toca o som uma vez ao chegar.
    try {
      if (req.sound && !playedRef.current) {
        playedRef.current = true;
        const candidates = _audioPathFor(req.sound);
        (async () => {
          for (const src of candidates) {
            try {
              const a = new Audio(src);
              a.volume = 0.9;
              audioRefs.current.push(a);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              await a.play();
              break;
            } catch (e) {
              // tenta o próximo candidato
            }
          }
        })();
      }
    } catch (e) {
      // ignore
    }

    requestAnimationFrame(() => el.classList.add("show"));

    startedAtRef.current = performance.now();
    durationRef.current = req.timeout ?? 8000;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startedAtRef.current;
      const pct = Math.max(0, Math.min(1, 1 - elapsed / durationRef.current));
      if (barRef.current) barRef.current.style.width = `${pct * 100}%`;
      if (elapsed >= durationRef.current) {
        onExpireRef.current();
        if (el) {
          el.classList.remove("show");
          el.classList.add("hide");
        }
        setTimeout(() => onRemoveRef.current(), 320);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        for (const a of audioRefs.current) {
          try {
            a.pause();
            try {
              a.currentTime = 0;
            } catch (e) {
              /* ignore */
            }
            a.src = "";
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        /* ignore */
      }
      audioRefs.current = [];
    };
    // Só reinicia quando o próprio request muda (ex.: prolong) ou o modo compacto.
  }, [req, shortMode]);

  useEffect(() => {
    if (!elRef.current) return;
    const el = elRef.current;
    if (flash === "accept") {
      el.style.boxShadow = "0 0 12px rgba(60,200,120,0.8)";
      setTimeout(() => {
        if (el) el.style.boxShadow = "";
      }, 400);
    } else if (flash === "deny") {
      el.style.boxShadow = "0 0 12px rgba(200,60,60,0.8)";
      setTimeout(() => {
        if (el) el.style.boxShadow = "";
      }, 400);
    }
  }, [flash, shortMode]);

  if (shortMode) {
    return (
      <MriCard
        className={`request-card w-[260px] rounded-md mb-1 transition-all duration-300 ${
          isHighPriority ? "border-destructive/60" : ""
        }`}
        ref={elRef}
        data-id={String(req.id)}
      >
        {/* Barra de progresso (largura controlada por requestAnimationFrame — sem
            transição CSS pra não atrasar em relação à remoção do card). */}
        <div className="absolute left-0 bottom-0 h-[2px] w-full bg-muted z-20">
          <div
            className="h-full w-full"
            ref={barRef}
            style={{ backgroundColor: accentColor }}
          />
        </div>

        <div className="p-2">
          <RequestHeader req={req} />
        </div>
      </MriCard>
    );
  }

  return (
    <MriCard
      className={`request-card w-[360px] transition-all duration-300 ${
        isHighPriority ? "border-destructive/60" : ""
      }`}
      ref={elRef}
      data-id={String(req.id)}
    >
      {/* Barra de progresso — topo (largura via requestAnimationFrame, sem
          transição CSS pra ficar em sincronia com a saída do card). */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-muted z-20">
        <div
          className="h-full w-full"
          ref={barRef}
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <RequestHeader req={req} />
        </div>
      </div>

      <MriCardContent className="p-2">
        <div className="grid grid-cols-1 gap-1">
          <RequestExtras extras={req.extras} />
        </div>

        <VehicleInfo vehicle={req.vehicle} />

        <RespondingUnits units={req.units} withLabel />
      </MriCardContent>

      <MriCardFooter className="pb-2">
        <div className="w-full flex place-content-around">
          <ActionBtn
            variant="accept"
            onClick={onAccept}
            shortcutKey={acceptKey}
            label={req.acceptText ?? t("action.accept")}
          />

          {!req.hideDeny && (
            <ActionBtn
              variant="deny"
              onClick={noop}
              shortcutKey={denyKey}
              label={req.denyText ?? t("action.refuse")}
            />
          )}
        </div>
      </MriCardFooter>
    </MriCard>
  );
};

export default RequestCard;
