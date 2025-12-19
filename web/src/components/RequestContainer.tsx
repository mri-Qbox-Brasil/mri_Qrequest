import React, { useEffect, useRef, useState } from "react";
import RequestCard, { RequestData } from "./RequestCard";
import DevPanel from "./DevPanel";
import { isEnvBrowser } from "../utils/misc";
import { fetchNui } from "../utils/fetchNui";
import { useTheme } from "../contexts/ThemeContext";

type RecordItem = {
  id: string;
  data: RequestData;
  key: number; // to force remounts when prolonged
  flash?: "accept" | "deny" | null;
};

const RequestContainer: React.FC = () => {
  const [requests, setRequests] = useState<RecordItem[]>([]);
  const [debugCount, setDebugCount] = useState(0);
  const [lastMsg, setLastMsg] = useState<any>(null);
  const acceptKeyRef = useRef("Y");
  const denyKeyRef = useRef("N");
  const [position, setPosition] = useState<"top-right" | "top-left">("top-right");

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      // Log incoming messages to help debugging in dev
      // eslint-disable-next-line no-console
      console.debug('[g5-request] message received:', ev && ev.data);
      setDebugCount((c) => c + 1);
      setLastMsg(ev && ev.data);
      const d = ev.data;
      if (!d || !d.action) return;
      if (d.action === "init") {
        if (d.acceptKey) acceptKeyRef.current = d.acceptKey;
        if (d.denyKey) denyKeyRef.current = d.denyKey;
        if (d.position) setPosition(d.position === "top-left" ? "top-left" : "top-right");
        // Os temas agora são gerenciados pelo ThemeContext via evento separado
      } else if (d.action === "add" && d.request) {
        addRequest(d.request);
        // Cada card aplica seu próprio tema individualmente, não globalmente
      } else if (d.action === "remove" && d.id) {
        removeRequest(String(d.id));
      } else if (d.action === "flashAccept" && d.id) {
        flashAccept(String(d.id));
      } else if (d.action === "flashDeny" && d.id) {
        flashDeny(String(d.id));
      } else if (d.action === "prolong" && d.id) {
        prolongRequest(String(d.id), d.set);
      }
    };

    window.addEventListener("message", handler as EventListener);

    // notify ready (same as original)
    fetchNui("g5_nui_ready", {}).catch(() => {});

    return () => window.removeEventListener("message", handler as EventListener);
  }, []);

  function addRequest(req: RequestData) {
    const id = String(req.id);
    setRequests((prev) => {
      if (prev.some((r) => r.id === id)) return prev;
      return [...prev, { id, data: req, key: Date.now(), flash: null }];
    });
  }

  function removeRequest(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== String(id)));
  }

  function flashAccept(id: string) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: "accept" } : r)));
    setTimeout(() => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: null } : r)));
    }, 420);
  }

  function flashDeny(id: string) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: "deny" } : r)));
    setTimeout(() => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: null } : r)));
    }, 420);
  }

  function prolongRequest(id: string, setMs?: number) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, key: Date.now(), data: { ...r.data, timeout: setMs ?? r.data.timeout } } : r)));
  }

  return (
    <div id="g5-request-root">
      {isEnvBrowser() ? <DevPanel /> : null}
      <div id="container" className={position === "top-left" ? "pos-top-left" : "pos-top-right"}>
        {requests.map((r) => (
          <RequestCard
            key={r.key}
            req={r.data}
            flash={r.flash}
            acceptKey={acceptKeyRef.current}
            denyKey={denyKeyRef.current}
            onExpire={() => {
              fetchNui("g5_request_answer", { id: r.id, accepted: false }).catch(() => {});
              removeRequest(r.id);
            }}
            onRemove={() => removeRequest(r.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default RequestContainer;
