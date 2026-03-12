import { Stroke } from "./drawing";

export interface DrawMessage {
  type: "STROKE";
  payload: {
    color: string;
    brushSize: number;
    points: { x: number; y: number }[];
  };
}

export interface IncomingStrokeMessage extends Stroke {
  userId: string;
  senderName: string;
  timestamp: number;
}

