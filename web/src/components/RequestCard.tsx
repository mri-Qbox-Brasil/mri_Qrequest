import React, { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

export type RequestData = {
  id: string | number;
  timeout?: number;
  themeType?: string | null;
  tagColor?: string | null;
  progressColor?: string | null;
  codeColor?: string | null;
  titleIcon?: string | null;
  titleIconColor?: string | null;
  acceptText?: string | null;
  denyText?: string | null;
  tagText?: string | null;
  tag?: string | null;
  code?: string | null;
  title?: string | null;
  extras?: any;
  sound?: string | null;
};

type Props = {
  req: RequestData;
  acceptKey: string;
  denyKey: string;
  onExpire: () => void;
  onRemove: () => void;
  flash?: "accept" | "deny" | null;
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

function playNotificationSound(name?: string) {
  if (!name || typeof name !== "string") return;
  if (name.trim().toLowerCase() === "off") return;
  const candidates = _audioPathFor(name);
  (async () => {
    for (const src of candidates) {
      try {
        const a = new Audio(src);
        a.volume = 0.9;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await a.play();
        return;
      } catch (e) {
        // continue
      }
    }
  })();
}

function _esc(s: any) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _parseColor(str?: string) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim().toLowerCase();
  if (s[0] === "#") {
    if (s.length === 4) {
      const r = parseInt(s[1] + s[1], 16);
      const g = parseInt(s[2] + s[2], 16);
      const b = parseInt(s[3] + s[3], 16);
      return [r, g, b];
    } else if (s.length === 7) {
      const r = parseInt(s.substr(1, 2), 16);
      const g = parseInt(s.substr(3, 2), 16);
      const b = parseInt(s.substr(5, 2), 16);
      return [r, g, b];
    }
    return null;
  }
  const m = s.match(/rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})/);
  if (m) {
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  }
  return null;
}

function _getContrastColor(colorStr?: string) {
  const rgb = _parseColor(colorStr);
  if (!rgb) return "#fff";
  const srgb = rgb.map((c) => c / 255);
  const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return lum > 0.179 ? "#000" : "#fff";
}

const RequestCard: React.FC<Props> = ({ req, acceptKey, denyKey, onExpire, onRemove, flash }) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const playedRef = useRef(false);
  const startedAtRef = useRef<number>(performance.now());
  const durationRef = useRef<number>(req.timeout ?? 8000);
  const rafRef = useRef<number | null>(null);
  const { themes } = useTheme();

  useEffect(() => {
    // initialize styles
    const el = elRef.current;
    if (!el) return;
    
    // Aplica o tema específico deste card
    const themeType = req.themeType || 'default';
    const cardTheme = themes[themeType] || themes['default'];
    
    // Debug logs
    console.log('[RequestCard] Aplicando tema:', {
      requestId: req.id,
      themeType,
      hasTheme: !!cardTheme,
      cardBg: cardTheme?.card_bg,
      availableThemes: Object.keys(themes)
    });
    
    if (cardTheme) {
      // Aplica todas as propriedades do tema como CSS variables locais neste card
      if (cardTheme.card_bg) el.style.setProperty("--card-bg", cardTheme.card_bg);
      if (cardTheme.title_bg) el.style.setProperty("--title-bg", cardTheme.title_bg);
      if (cardTheme.text) el.style.setProperty("--text", cardTheme.text);
      if (cardTheme.muted) el.style.setProperty("--muted", cardTheme.muted);
      if (cardTheme.tag_bg) el.style.setProperty("--tag-bg", cardTheme.tag_bg);
      if (cardTheme.tag_fg) el.style.setProperty("--tag-fg", cardTheme.tag_fg);
      if (cardTheme.code_bg) el.style.setProperty("--code-bg", cardTheme.code_bg);
      if (cardTheme.code_fg) el.style.setProperty("--code-fg", cardTheme.code_fg);
      if (cardTheme.progress_bg) el.style.setProperty("--progress-bg", cardTheme.progress_bg);
      if (cardTheme.progress_color) el.style.setProperty("--progress-color", cardTheme.progress_color);
      if (cardTheme.accent) el.style.setProperty("--accent", cardTheme.accent);
      
      console.log('[RequestCard] Tema aplicado com sucesso para request:', req.id);
    } else {
      console.warn('[RequestCard] Nenhum tema encontrado para:', themeType);
    }
    
    // Cores personalizadas sobrescrevem o tema
    if (req.tagColor) el.style.setProperty("--tag-bg", req.tagColor);
    if (req.progressColor) el.style.setProperty("--progress-color", req.progressColor);
    if (req.codeColor) el.style.setProperty("--code-bg", req.codeColor);

    if (req.tagColor) el.style.setProperty("--tag-fg", _getContrastColor(req.tagColor));
    if (req.progressColor) el.style.setProperty("--progress-fg", _getContrastColor(req.progressColor));
    if (req.codeColor) el.style.setProperty("--code-fg", _getContrastColor(req.codeColor));

    // play sound once on mount (arrival)
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
              // continue to next candidate
            }
          }
        })();
      }
    } catch (e) {
      // ignore
    }

    // show animation
    requestAnimationFrame(() => el.classList.add("show"));

    startedAtRef.current = performance.now();
    durationRef.current = req.timeout ?? 8000;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startedAtRef.current;
      const pct = Math.max(0, Math.min(1, 1 - elapsed / durationRef.current));
      if (barRef.current) barRef.current.style.width = `${pct * 100}%`;
      if (elapsed >= durationRef.current) {
        onExpire();
        // remove animation
        if (el) {
          el.classList.remove("show");
          el.classList.add("hide");
        }
        setTimeout(() => onRemove(), 320);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // stop any playing audio when the card unmounts
      try {
        for (const a of audioRefs.current) {
          try {
            a.pause();
            try { a.currentTime = 0; } catch (e) {}
            // disconnect source
            // @ts-ignore
            a.src = '';
          } catch (e) {}
        }
      } catch (e) {}
      audioRefs.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req, onExpire, onRemove, themes]);

  useEffect(() => {
    if (!elRef.current) return;
    const el = elRef.current;
    if (flash === "accept") {
      el.style.boxShadow = "0 0 12px rgba(60,200,120,0.8)";
      setTimeout(() => (el.style.boxShadow = ""), 400);
    } else if (flash === "deny") {
      el.style.boxShadow = "0 0 12px rgba(200,60,60,0.8)";
      setTimeout(() => (el.style.boxShadow = ""), 400);
    }
  }, [flash]);

  function _renderExtras(extras: any) {
    if (!extras) return null;
    let extrasObj = null as any;
    try {
      extrasObj = typeof extras === "string" ? JSON.parse(extras) : extras;
    } catch (e) {
      extrasObj = null;
    }

    if (Array.isArray(extrasObj)) {
      return extrasObj.map((item: any, idx: number) => {
        if (!item || typeof item !== "object") return null;
        const icon = item.icon;
        const name = item.name;
        const value = item.value;
        if (value === null || value === undefined || value === "") return null;
        return (
          <div className="mutedline extra-item" key={idx}>
            <i className={`fa fa-${_esc(icon || "")}`} style={{ marginRight: 6 }} />
            <strong>{_esc(name || "")}</strong>: {_esc(value)}
          </div>
        );
      });
    }

    if (extrasObj && typeof extrasObj === "object") {
      return Object.entries(extrasObj).map(([k, v]: any, idx) => {
        if (v === null || v === undefined || v === "") return null;
        return (
          <div className="mutedline extra-item" key={idx}>
            <i className={`fa fa-${_esc(k)}`} style={{ marginRight: 6 }} />
            <strong>{_esc(k)}</strong>: {_esc(v)}
          </div>
        );
      });
    }

    return <div className="mutedline">{_esc(typeof extras === "string" ? extras : JSON.stringify(extras))}</div>;
  }

  // Pega o tema para aplicar inline como fallback
  const themeType = req.themeType || 'default';
  const cardTheme = themes[themeType] || themes['default'];

  return (
    <div 
      className="request-card" 
      ref={elRef} 
      data-id={String(req.id)}
      style={{
        background: cardTheme?.card_bg || undefined
      }}
    >
      <div className="request-progress">
        <div className="bar" ref={barRef} />
      </div>
      <div className="top-row" style={{
        backgroundColor: cardTheme?.title_bg || undefined
      }}>
        {req.tagText || req.tag ? <div className="tag">{_esc(req.tagText) || `#${_esc(req.tag || "")}`}</div> : null}
        {req.code ? <div className="code">{_esc(req.code)}</div> : null}
        {req.title ? (
          <div className="title" style={{ marginLeft: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span className="title-text">{_esc(req.title)}</span>
            {req.titleIcon ? (
              <span className="title-icon" style={{ marginLeft: 8 }}>
                <i className={`fa fa-${_esc(req.titleIcon)}`} aria-hidden="true" style={req.titleIconColor ? { color: req.titleIconColor } : {}} />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="card-body">
        {_renderExtras(req.extras)}

        <div className="card-footer">
          <div className="mutedline small">
            <div className="ghost">[{acceptKey}] {req.acceptText ?? "Aceitar"}</div>
            <div className="btn ghost">[{denyKey}] {req.denyText ?? "Recusar"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
