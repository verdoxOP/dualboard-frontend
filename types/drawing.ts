export interface Point {
  x: number;
  y: number;
}

export interface StrokePayload {
  color: string;
  brushSize: number;
  points: Point[];
}

export interface Stroke {
  userId?: string;
  senderName?: string;
  type: "STROKE";
  payload: StrokePayload;
  timestamp?: number;
}

export type Tool = "pen" | "rectangle" | "circle" | "line";

