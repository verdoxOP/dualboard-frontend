"use client";

import { useSession } from "@/components/providers/SessionProvider";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { fetchRoom } from "@/lib/api";
import { useRoomDrawingSync } from "@/hooks/useRoomDrawingSync";
import { Tool } from "@/types/drawing";
import { DEFAULT_COLOR, DEFAULT_BRUSH_SIZE } from "@/lib/constants";
import Canvas from "@/components/whiteboard/Canvas";
import Toolbar from "@/components/whiteboard/Toolbar";
import ConnectionStatus from "@/components/whiteboard/ConnectionStatus";
import InviteCodeOverlay from "@/components/whiteboard/InviteCodeOverlay";

export default function RoomPage() {
  const { user, loading: sessionLoading, isAuthenticated } = useSession();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [inviteCode, setInviteCode] = useState<string | undefined>();

  // Drawing state
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  const {
    strokes,
    previewStrokes,
    connected,
    historyLoading,
    publishStroke,
    publishPreview,
    handleUndo,
  } = useRoomDrawingSync(roomId, user?.id, isAuthenticated);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [sessionLoading, isAuthenticated, router]);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const room = await fetchRoom(roomId);
      setInviteCode(room.inviteCode);
    } catch (err) {
      console.error("Failed to load room details:", err);
      setInviteCode(undefined);
    }
  }, [roomId]);

  useEffect(() => {
    if (isAuthenticated && roomId) {
      loadRoom();
    }
  }, [isAuthenticated, roomId, loadRoom]);

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
      />

      <InviteCodeOverlay inviteCode={inviteCode} />

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
            onStrokeComplete={publishStroke}
            onPreview={publishPreview}
          />
        </div>
      )}

      <ConnectionStatus connected={connected} />
    </div>
  );
}

