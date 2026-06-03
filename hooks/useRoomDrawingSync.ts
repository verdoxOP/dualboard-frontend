import { useState, useEffect, useCallback, useRef } from "react";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Stroke } from "@/types/drawing";
import { BACKEND_URL } from "@/lib/constants";

// Ensure the mapping is consistent between frontend "payload" and backend "data"
export function useRoomDrawingSync(roomId: string, userId?: string, isAuthenticated: boolean = true) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [previewStrokes, setPreviewStrokes] = useState<Stroke[]>([]);
  const [connected, setConnected] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);


  const loadHistory = useCallback(async () => {
    if (!roomId) return;
    setHistoryLoading(true);
    try {

      await fetch(`${BACKEND_URL}/api/v1/rooms/join/${roomId}`, {
        method: 'POST',
        credentials: 'include',
      });

      const response = await fetch(`${BACKEND_URL}/api/v1/rooms/${roomId}/history`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch history");

      const events: any[] = await response.json();


      const mappedHistory: Stroke[] = events.map(evt => ({
        ...evt,
        payload: evt.data || evt.payload,
      }));
      setStrokes(mappedHistory);
    } catch (err) {
      console.error("Failed to load room history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [roomId]);

  // 2. STOMP Connection
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    console.log(`Initializing STOMP client with webSocketFactory pointing to: ${BACKEND_URL}/ws`);

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        console.log("STOMP:", str);
      },
      onConnect: () => {
        console.log("STOMP Connected!");
        setConnected(true);

        const sub1 = client.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {
          try {
            const parsed = JSON.parse(msg.body);
            // Remap data to payload
            const stroke: Stroke = { ...parsed, payload: parsed.data || parsed.payload };

            if (stroke.userId !== userId) {
              setStrokes(prev => [...prev, stroke]);
            }
            if (stroke.userId) {
              setPreviewStrokes(prev => prev.filter(p => p.userId !== stroke.userId));
            }
          } catch (e) {
            console.error("Failed to parse stroke message:", e);
          }
        });
        console.log(`Subscribed to /topic/room/${roomId}`);

        const sub2 = client.subscribe(`/topic/room/${roomId}/preview`, (msg: IMessage) => {
          try {
            const parsed = JSON.parse(msg.body);
            // Remap data to payload
            const preview: Stroke = { ...parsed, payload: parsed.data || parsed.payload };

            if (preview.userId !== userId) {
              setPreviewStrokes(prev => {
                const filtered = prev.filter(p => p.userId !== preview.userId);
                return [...filtered, preview];
              });
            }
          } catch (e) {
            console.error("Failed to parse preview message:", e);
          }
        });
        console.log(`Subscribed to /topic/room/${roomId}/preview`);

        const sub3 = client.subscribe('/user/queue/errors', (msg: IMessage) => {
          const body = JSON.parse(msg.body);
          console.error("BACKEND REJECTED STROKE:", body);
          alert("Stroke rejected: " + body.message);
        });
        console.log("Subscribed to /user/queue/errors");

        subsRef.current = [sub1, sub2, sub3];
        loadHistory();
      },
      onDisconnect: () => {
        console.log("STOMP Disconnected");
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP Error (Broker Error):", frame);
        setConnected(false);
      },
      onWebSocketError: (event) => {
        console.error("STOMP WebSocket Error:", event);
      },
      onWebSocketClose: (event) => {
        console.log("STOMP WebSocket Closed:", event);
        setConnected(false);
      },
    });

    clientRef.current = client;
    console.log("Activating STOMP client...");
    client.activate();

    return () => {
      console.log("Cleaning up STOMP client...");
      subsRef.current.forEach(s => {
        try { s.unsubscribe(); } catch {}
      });
      subsRef.current = [];
      client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, roomId, userId, loadHistory]);

  const publishStroke = useCallback((stroke: Stroke) => {
    // Add locally immediately
    setStrokes(prev => [...prev, stroke]);

    // Publish to server, remapping "payload" to "data"
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/draw/${roomId}`,
        body: JSON.stringify({ type: stroke.type, data: stroke.payload }),
      });
    }
  }, [roomId]);

  const publishPreview = useCallback((stroke: Stroke) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/draw/${roomId}/preview`,
        body: JSON.stringify({ type: stroke.type, data: stroke.payload }),
      });
    }
  }, [roomId]);

  const handleUndo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  return {
    strokes,
    previewStrokes,
    connected,
    historyLoading,
    publishStroke,
    publishPreview,
    handleUndo,
  };
}
