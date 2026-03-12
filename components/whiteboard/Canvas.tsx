"use client";

import { useRef, useEffect, useCallback } from "react";
import { Point, Stroke, Tool } from "@/types/drawing";
import {
  drawStroke,
  drawShapeFromPoints,
  redrawAll,
  getCanvasPoint,
  shapeToStroke,
} from "@/lib/canvasUtils";

interface CanvasProps {
  strokes: Stroke[];
  previewStrokes: Stroke[];
  tool: Tool;
  color: string;
  brushSize: number;
  onStrokeComplete: (stroke: Stroke) => void;
  onPreview: (stroke: Stroke) => void;
}

export default function Canvas({
  strokes,
  previewStrokes,
  tool,
  color,
  brushSize,
  onStrokeComplete,
  onPreview,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<Point[]>([]);
  const shapeStart = useRef<Point | null>(null);

  // Resize canvas to fill container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Redraw whenever strokes or previews change, or on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    redrawAll(ctx, canvas, strokes);

    // Draw remote preview strokes
    for (const ps of previewStrokes) {
      drawStroke(ctx, ps);
    }
  }, [strokes, previewStrokes]);

  // Also redraw on resize
  useEffect(() => {
    const handler = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      redrawAll(ctx, canvas, strokes);
      for (const ps of previewStrokes) {
        drawStroke(ctx, ps);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [strokes, previewStrokes]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawing.current = true;
    const pt = getCanvasPoint(e, canvas);

    if (tool === "pen") {
      currentPoints.current = [pt];
    } else {
      shapeStart.current = pt;
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pt = getCanvasPoint(e, canvas);

    if (tool === "pen") {
      currentPoints.current.push(pt);

      // Draw incrementally for local feedback
      const pts = currentPoints.current;
      if (pts.length >= 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }

      // Send live preview (throttled — every 3 points)
      if (pts.length % 3 === 0) {
        const previewStroke: Stroke = {
          type: "STROKE",
          payload: { color, brushSize, points: [...pts] },
        };
        onPreview(previewStroke);
      }
    } else {
      // Shape preview: redraw everything + shape overlay
      redrawAll(ctx, canvas, strokes);
      for (const ps of previewStrokes) {
        drawStroke(ctx, ps);
      }
      if (shapeStart.current) {
        drawShapeFromPoints(
          ctx,
          tool as "rectangle" | "circle" | "line",
          shapeStart.current,
          pt,
          color,
          brushSize
        );
      }
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing.current) return;

    isDrawing.current = false;

    if (tool === "pen") {
      if (currentPoints.current.length > 0) {
        const stroke: Stroke = {
          type: "STROKE",
          payload: {
            color,
            brushSize,
            points: [...currentPoints.current],
          },
        };
        onStrokeComplete(stroke);
      }
      currentPoints.current = [];
    } else {
      // Shape tool
      if (shapeStart.current) {
        const pt = getCanvasPoint(e, canvas);
        const stroke = shapeToStroke(
          tool as "rectangle" | "circle" | "line",
          shapeStart.current,
          pt,
          color,
          brushSize
        );
        onStrokeComplete(stroke);
        shapeStart.current = null;
      }
    }
  };

  const handlePointerLeave = () => {
    if (isDrawing.current && tool === "pen" && currentPoints.current.length > 0) {
      const stroke: Stroke = {
        type: "STROKE",
        payload: {
          color,
          brushSize,
          points: [...currentPoints.current],
        },
      };
      onStrokeComplete(stroke);
      currentPoints.current = [];
    }
    isDrawing.current = false;
    shapeStart.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerLeave}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}

