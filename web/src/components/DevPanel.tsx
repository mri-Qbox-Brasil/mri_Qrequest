import React, { useState } from "react";
import { isEnvBrowser } from "../utils/misc";
import { useTheme } from "../contexts/ThemeContext";

const DevPanel: React.FC = () => {
  const [title, setTitle] = useState("Pedido de Ajuda");
  const [tag, setTag] = useState("VIP");
  const [code, setCode] = useState("");
  const [timeout, setTimeoutVal] = useState(8000);
  const [sound, setSound] = useState("");
  const [id, setId] = useState(1);
  const [position, setPosition] = useState<"top-right" | "top-left">("top-right");
  const [themeType, setThemeType] = useState<string>("default");
  const [themeInput, setThemeInput] = useState<string>(JSON.stringify({ card_bg: 'rgba(0,0,0,0.8)', progress_color: '#22c55e' }, null, 2));
  const [bgUrl, setBgUrl] = useState<string>('');
  const { setThemeType: applyThemeType } = useTheme();

  if (!isEnvBrowser()) return null;

  function sendMessage(msg: any) {
    window.postMessage(msg, '*');
  }

  function addRequest() {
    const req = {
      id,
      title,
      tag: tag ? tag.replace(/^#/, "") : undefined,
      tagText: tag || undefined,
      code: code || undefined,
      timeout: Number(timeout) || 8000,
      sound: sound || undefined,
      themeType: themeType !== "default" ? themeType : undefined,
      extras: [{ icon: "user", name: "Nome", value: "Teste" }],
    };
    sendMessage({ action: "add", request: req });
  }

  function removeRequest() {
    sendMessage({ action: "remove", id });
  }

  function flashAccept() {
    sendMessage({ action: "flashAccept", id });
  }

  function flashDeny() {
    sendMessage({ action: "flashDeny", id });
  }

  function prolongRequest() {
    sendMessage({ action: "prolong", id, set: Number(timeout) });
  }

  function init() {
    sendMessage({ action: "init", position, acceptKey: "Y", denyKey: "N" });
  }

  const changeTheme = () => {
    applyThemeType(themeType);
  };

  const applyCustomTheme = () => {
    try {
      const parsed = JSON.parse(themeInput);
      sendMessage({ action: 'init', themes: { custom: parsed } });
      setTimeout(() => applyThemeType('custom'), 100);
    } catch (e) {
      // ignore parse errors
      // eslint-disable-next-line no-console
      console.error('Invalid theme JSON', e);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    left: 16,
    background: '#0f1724',
    color: '#e6eef0',
    padding: 12,
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(2,6,23,0.6)',
    width: 320,
    zIndex: 99999,
    fontSize: 13,
  };

  const inputStyle: React.CSSProperties = { width: '100%', marginTop: 6, padding: 6, borderRadius: 6, background: '#0b1220', color: '#e6eef0', border: '1px solid rgba(255,255,255,0.04)' };
  const btnStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer' };

  return (
    <div className="dev-panel" style={{ ...containerStyle, pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Dev Test Panel</strong>
        <div style={{ fontSize: 12, color: '#9aa4ad' }}>Dev only</div>
      </div>
      <div style={{ display: 'block', gap: 8 }}>
        <div>
          <label style={{ fontSize: 12, color: '#9aa4ad' }}>ID</label>
          <input style={inputStyle} value={id} onChange={(e) => setId(Number(e.target.value))} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#9aa4ad' }}>Title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#9aa4ad' }}>Tag</label>
            <input style={inputStyle} value={tag} onChange={(e) => setTag(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#9aa4ad' }}>Code</label>
            <input style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#9aa4ad' }}>Timeout ms</label>
            <input style={inputStyle} value={timeout} onChange={(e) => setTimeoutVal(Number(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#9aa4ad' }}>Sound</label>
            <input style={inputStyle} value={sound} onChange={(e) => setSound(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, color: '#9aa4ad' }}>Position</label>
          <select style={{ width: '100%', marginTop: 6, padding: 6, borderRadius: 6, background: '#0b1220', color: '#e6eef0', border: '1px solid rgba(255,255,255,0.04)' }} value={position} onChange={(e) => setPosition(e.target.value as any)}>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </div>
        
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, color: '#9aa4ad' }}>Theme Type</label>
          <select style={{ width: '100%', marginTop: 6, padding: 6, borderRadius: 6, background: '#0b1220', color: '#e6eef0', border: '1px solid rgba(255,255,255,0.04)' }} value={themeType} onChange={(e) => setThemeType(e.target.value)}>
            <option value="default">Default (Verde)</option>
            <option value="ambulancia">Ambulância (Vermelho)</option>
            <option value="police">Police (Azul)</option>
            <option value="bombeiro">Bombeiro (Laranja)</option>
            <option value="recrutamento">Recrutamento (Roxo)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button style={{ ...btnStyle, background: '#10b981', color: '#042018', flex: 1 }} onClick={addRequest}>Add</button>
          <button style={{ ...btnStyle, background: '#f59e0b', color: '#111827', flex: 1 }} onClick={prolongRequest}>Prolong</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button style={{ ...btnStyle, background: '#dc2626', color: '#fff', flex: 1 }} onClick={removeRequest}>Remove</button>
          <button style={{ ...btnStyle, background: '#16a34a', color: '#fff', flex: 1 }} onClick={flashAccept}>Flash✓</button>
          <button style={{ ...btnStyle, background: '#374151', color: '#fff', flex: 1 }} onClick={flashDeny}>Flash✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button style={{ ...btnStyle, width: '100%', background: '#334155', color: '#fff', flex: 1 }} onClick={init}>Init</button>
          <button style={{ ...btnStyle, width: '100%', background: '#8b5cf6', color: '#fff', flex: 1 }} onClick={changeTheme}>Apply Theme</button>
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <label style={{ fontSize: 12, color: '#9aa4ad', fontWeight: 'bold' }}>Custom Theme (JSON)</label>
          <textarea value={themeInput} onChange={(e) => setThemeInput(e.target.value)} style={{ width: '100%', height: 96, fontFamily: 'monospace', fontSize: 12, marginTop: 6, padding: 6, borderRadius: 6, background: '#0b1220', color: '#e6eef0', border: '1px solid rgba(255,255,255,0.04)' }} placeholder='{"card_bg": "rgba(0,0,0,0.8)", ...}' />
          <button style={{ ...btnStyle, width: '100%', background: '#3b82f6', color: '#fff', marginTop: 6 }} onClick={applyCustomTheme}>Apply Custom Theme</button>
        </div>
      </div>
    </div>
  );
};

export default DevPanel;
