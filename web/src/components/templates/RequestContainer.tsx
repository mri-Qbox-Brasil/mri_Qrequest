import React, { useEffect, useRef, useState, useCallback } from "react";
import RequestCard from "../organisms/RequestCard";
import DevPanel from "../DevPanel";
import { isEnvBrowser } from "../../utils/misc";
import { fetchNui } from "../../utils/fetchNui";
import DispatchMenu from "../organisms/DispatchMenu";
import { RequestData } from "../../types";
import { useI18n } from "../../i18n";

type RecordItem = {
    id: string;
    data: RequestData;
    key: number; // to force remounts when prolonged
    flash?: "accept" | "deny" | null;
};

type HistoryItem = {
    id: string;
    data: RequestData;
    time: number;
};

type Settings = {
    callsign?: string;
    isMuted?: boolean;
    shortMode?: boolean;
    keepRequestsOpen?: boolean;
};

const RequestContainer: React.FC = () => {
    const [requests, setRequests] = useState<RecordItem[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const acceptKeyRef = useRef("Y");
    const denyKeyRef = useRef("N");
    const [position, setPosition] = useState<"top-right" | "top-left">("top-right");
    const [showDispatch, setShowDispatch] = useState(false);
    const [initialTab, setInitialTab] = useState<"history" | "settings">("history");
    const [callsign, setCallsign] = useState(() => {
        const saved = localStorage.getItem("g5_callsign");
        return saved || "";
    });
    const [isMuted, setIsMuted] = useState(false);
    const [shortMode, setShortMode] = useState(false);
    const [keepRequestsOpen, setKeepRequestsOpen] = useState(true);
    const { setLocale } = useI18n();

    // Sync settings with server (example)
    useEffect(() => {
        fetchNui("getSettings")
            .then((res: unknown) => {
                const data = res as Settings;
                if (data) {
                    if (data.callsign) setCallsign(data.callsign);
                    if (data.isMuted !== undefined) setIsMuted(data.isMuted);
                    if (data.shortMode !== undefined) setShortMode(data.shortMode);
                    if (data.keepRequestsOpen !== undefined) setKeepRequestsOpen(data.keepRequestsOpen);
                }
            })
            .catch(() => { });
    }, []);

    const addRequest = useCallback((req: RequestData) => {
        const id = String(req.id);
        setRequests((prev) => {
            if (prev.some((r) => r.id === id)) return prev;
            return [...prev, { id, data: req, key: Date.now(), flash: null }];
        });
        // Add to history too
        setHistory((prev) => {
            if (prev.some((h) => h.id === id)) return prev;
            return [{ id, data: req, time: Date.now() }, ...prev].slice(0, 50);
        });
    }, []);

    const removeRequest = useCallback((id: string) => {
        setRequests((prev) => prev.filter((r) => r.id !== String(id)));
    }, []);

    const flashAccept = useCallback((id: string) => {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: "accept" } : r)));
        setTimeout(() => {
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: null } : r)));
        }, 400);
    }, []);

    const flashDeny = useCallback((id: string) => {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: "deny" } : r)));
        setTimeout(() => {
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, flash: null } : r)));
        }, 400);
    }, []);

    const prolongRequest = useCallback((id: string, setMs?: number) => {
        setRequests((prev) =>
            prev.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        key: Date.now(),
                        data: { ...r.data, timeout: setMs ?? r.data.timeout },
                    }
                    : r,
            ),
        );
    }, []);

    useEffect(() => {
        const handler = (ev: MessageEvent) => {
            const d = ev.data;
            if (!d || !d.action) return;

            switch (d.action) {
                case "init":
                    if (d.acceptKey) acceptKeyRef.current = d.acceptKey;
                    if (d.denyKey) denyKeyRef.current = d.denyKey;
                    if (d.position) setPosition(d.position === "top-left" ? "top-left" : "top-right");
                    if (d.locale) setLocale(d.locale);
                    break;
                case "add":
                    if (d.request) addRequest(d.request);
                    break;
                case "remove":
                    if (d.id) removeRequest(String(d.id));
                    break;
                case "flashAccept":
                    if (d.id) flashAccept(String(d.id));
                    break;
                case "flashDeny":
                    if (d.id) flashDeny(String(d.id));
                    break;
                case "prolong":
                    if (d.id) prolongRequest(String(d.id), d.set);
                    break;
                case "openDispatch":
                    setInitialTab("history");
                    setShowDispatch(true);
                    break;
                case "openSettings":
                    setInitialTab("settings");
                    setShowDispatch(true);
                    break;
                case "updateCallsign":
                    if (d.callsign) setCallsign(d.callsign);
                    break;
            }
        };

        window.addEventListener("message", handler);
        fetchNui("nuiReady", {}).catch(() => { });

        return () => window.removeEventListener("message", handler);
    }, [addRequest, removeRequest, flashAccept, flashDeny, prolongRequest, setLocale]);

    const clearHistory = () => {
        // Optionally alert server that we cleared local history?
        setHistory([]);
    };

    const locateRequest = (req: RequestData) => {
        const extras = req.extras as Record<string, unknown> | undefined;
        fetchNui("locate", { id: req.id, x: extras?.x, y: extras?.y }).catch(() => { });
        setShowDispatch(false);
    };

    const onAcceptHistory = (item: HistoryItem) => {
        if (acceptKeyRef.current) flashAccept(item.id);
        fetchNui("answer", { id: item.id, accepted: true, callsign }).catch(() => { });
    };

    const onAcceptCard = (req: RequestData) => {
        if (acceptKeyRef.current) flashAccept(String(req.id));
        fetchNui("answer", { id: req.id, accepted: true, callsign }).catch(() => { });
    };

    const isVisible = requests.length > 0 || (showDispatch && (keepRequestsOpen || showDispatch));

    // Ordena por tempo restante: quem expira mais cedo (menos tempo pra aceitar/
    // recusar) fica no topo. O instante de expiração é fixo por card (momento em
    // que entrou + timeout), então a ordem é estável — não reordena a cada frame.
    const expiresAt = (r: RecordItem) => r.key + (r.data.timeout ?? 8000);
    const sortedRequests = [...requests].sort((a, b) => expiresAt(a) - expiresAt(b));

    return (
        <div id="g5-request-root">
            {isEnvBrowser() && <DevPanel />}
            <div
                id="container"
                className={`${position === "top-left" ? "pos-top-left" : "pos-top-right"} ${isVisible ? "" : "hidden"
                    }`}
            >
                {sortedRequests.map((r) => (
                    <RequestCard
                        key={r.id}
                        req={r.data}
                        flash={r.flash}
                        acceptKey={acceptKeyRef.current}
                        denyKey={denyKeyRef.current}
                        onExpire={() => {
                            // Barra zerou: avisa o servidor e remove na hora, pra os
                            // cards de baixo subirem imediatamente (sem buraco).
                            fetchNui("answer", { id: r.id, accepted: false }).catch(() => { });
                            removeRequest(r.id);
                        }}
                        onRemove={() => removeRequest(r.id)}
                        onAccept={() => onAcceptCard(r.data)}
                        shortMode={shortMode}
                    />
                ))}
            </div>

            <DispatchMenu
                isOpen={showDispatch}
                onClose={() => setShowDispatch(false)}
                history={history}
                onClear={clearHistory}
                onLocate={locateRequest}
                onAccept={onAcceptHistory}
                onDeny={(item) => {
                    if (denyKeyRef.current) flashDeny(item.id);
                    fetchNui("g5_request_answer", { id: item.id, accepted: false }).catch(() => { });
                }}
                onDetach={(item) => {
                    fetchNui("detachUnit", { id: item.id }).catch(() => { });
                }}
                myCallsign={callsign}
                isMuted={isMuted}
                onToggleMute={setIsMuted}
                shortMode={shortMode}
                onToggleShortMode={setShortMode}
                keepRequestsOpen={keepRequestsOpen}
                onToggleKeepRequestsOpen={setKeepRequestsOpen}
                callsign={callsign}
                setCallsign={setCallsign}
                initialTab={initialTab}
            />
        </div>
    );
};

export default RequestContainer;
