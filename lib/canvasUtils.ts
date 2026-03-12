import { Point, Stroke } from "@/types/drawing";

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
) {
  const { color, brushSize, points } = stroke.payload;
  if (points.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

export function drawShapeFromPoints(
  ctx: CanvasRenderingContext2D,
  tool: "rectangle" | "circle" | "line",
  start: Point,
  end: Point,
  color: string,
  brushSize: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (tool) {
    case "rectangle": {
      const w = end.x - start.x;
      const h = end.y - start.y;
      ctx.strokeRect(start.x, start.y, w, h);
      break;
    }
    case "circle": {
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = start.x + (end.x - start.x) / 2;
      const cy = start.y + (end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "line": {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      break;
    }
  }
}

export function shapeToStroke(
  tool: "rectangle" | "circle" | "line",
  start: Point,
  end: Point,
  color: string,
  brushSize: number
): Stroke {
  let points: Point[];
  switch (tool) {
    case "line":
      points = [start, end];
      break;
    case "rectangle":
      points = [
        start,
        { x: end.x, y: start.y },
        end,
        { x: start.x, y: end.y },
        start,
      ];
      break;
    case "circle": {
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = start.x + (end.x - start.x) / 2;
      const cy = start.y + (end.y - start.y) / 2;
      const segments = 64;
      points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (2 * Math.PI * i) / segments;
        points.push({
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
        });
      }
      break;
    }
  }
  return { type: "STROKE", payload: { color, brushSize, points } };
}

export function redrawAll(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  strokes: Stroke[]
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }
}

export function getCanvasPoint(
  e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX: number, clientY: number;
  if ("touches" in e) {
    const touch = e.touches[0] || (e as TouchEvent).changedTouches[0];
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

