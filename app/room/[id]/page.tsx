"use client";

import { useSession } from "@/components/providers/SessionProvider";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchRoomHistory } from "@/lib/api";
import {
  createStompClient,
  subscribeToRoom,
  subscribeToPreview,
  publishStroke,
  publishPreview,
} from "@/lib/stomp";
import { Stroke, Tool } from "@/types/drawing";
import { DEFAULT_COLOR, DEFAULT_BRUSH_SIZE } from "@/lib/constants";
import Canvas from "@/components/whiteboard/Canvas";
import Toolbar from "@/components/whiteboard/Toolbar";
import ConnectionStatus from "@/components/whiteboard/ConnectionStatus";
import { Client, StompSubscription } from "@stomp/stompjs";

export default function RoomPage() {
  const { user, loading: sessionLoading, isAuthenticated } = useSession();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [previewStrokes, setPreviewStrokes] = useState<Stroke[]>([]);
  const [connected, setConnected] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | undefined>();

  // Drawing state
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  // Refs for STOMP
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [sessionLoading, isAuthenticated, router]);

  // Load history
  const loadHistory = useCallback(async () => {
    if (!roomId) return;
    setHistoryLoading(true);
    try {
      const history = await fetchRoomHistory(roomId);
      setStrokes(history);
    } catch (err) {
      console.error("Failed to load room history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (isAuthenticated && roomId) {
      loadHistory();
    }
  }, [isAuthenticated, roomId, loadHistory]);

  // Connect STOMP
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    const client = createStompClient(
      (stompClient) => {
        setConnected(true);

        // Subscribe to final strokes
        const sub1 = subscribeToRoom(stompClient, roomId, (msg) => {
          try {
            const stroke: Stroke = JSON.parse(msg.body);
            // Only add strokes from other users
            if (stroke.userId !== user?.id) {
              setStrokes((prev) => [...prev, stroke]);
            }
            // Clear preview for this user
            if (stroke.userId) {
              setPreviewStrokes((prev) =>
                prev.filter((p) => p.userId !== stroke.userId)
              );
            }
          } catch (e) {
            console.error("Failed to parse stroke message:", e);
          }
        });

        // Subscribe to previews
        const sub2 = subscribeToPreview(stompClient, roomId, (msg) => {
          try {
            const preview: Stroke = JSON.parse(msg.body);
            if (preview.userId !== user?.id) {
              setPreviewStrokes((prev) => {
                const filtered = prev.filter(
                  (p) => p.userId !== preview.userId
                );
                return [...filtered, preview];
              });
            }
          } catch (e) {
            console.error("Failed to parse preview message:", e);
          }
        });

        subsRef.current = [sub1, sub2];
      },
      () => {
        setConnected(false);
      },
      () => {
        // On STOMP error — will auto-reconnect
        setConnected(false);
      }
    );

    clientRef.current = client;
    client.activate();

    return () => {
      subsRef.current.forEach((s) => {
        try {
          s.unsubscribe();
        } catch {}
      });
      subsRef.current = [];
      client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, roomId, user?.id]);

  // Re-fetch history on reconnect
  useEffect(() => {
    if (connected && roomId) {
      loadHistory();
    }
  }, [connected, roomId, loadHistory]);

  // Handlers
  const handleStrokeComplete = useCallback(
    (stroke: Stroke) => {
      // Add locally immediately
      setStrokes((prev) => [...prev, stroke]);

      // Publish to server
      if (clientRef.current?.connected) {
        publishStroke(clientRef.current, roomId, {
          type: stroke.type,
          payload: stroke.payload,
        });
      }
    },
    [roomId]
  );

  const handlePreview = useCallback(
    (stroke: Stroke) => {
      if (clientRef.current?.connected) {
        publishPreview(clientRef.current, roomId, {
          type: stroke.type,
          payload: stroke.payload,
        });
      }
    },
    [roomId]
  );

  const handleUndo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <Toolbar
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        tool={tool}
        setTool={setTool}
        onUndo={handleUndo}
        canUndo={strokes.length > 0}
        inviteCode={inviteCode}
      />

      {historyLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            <span className="text-sm text-gray-500">Loading canvas...</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full pt-12">
          <Canvas
            strokes={strokes}
            previewStrokes={previewStrokes}
            tool={tool}
            color={color}
            brushSize={brushSize}
            onStrokeComplete={handleStrokeComplete}
            onPreview={handlePreview}
          />
        </div>
      )}

      <ConnectionStatus connected={connected} />
    </div>
  );
}

