"use client";

import { Tool } from "@/types/drawing";
import {
  COLORS,
  DEFAULT_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
} from "@/lib/constants";

interface ToolbarProps {
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  onUndo: () => void;
  canUndo: boolean;
  inviteCode?: string;
}

export default function Toolbar({
  color,
  setColor,
  brushSize,
  setBrushSize,
  tool,
  setTool,
  onUndo,
  canUndo,
  inviteCode,
}: ToolbarProps) {
  const tools: { value: Tool; label: string; icon: string }[] = [
    { value: "pen", label: "Pen", icon: "✏️" },
    { value: "line", label: "Line", icon: "📏" },
    { value: "rectangle", label: "Rectangle", icon: "⬜" },
    { value: "circle", label: "Circle", icon: "⭕" },
  ];

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 px-4 py-2 overflow-x-auto">
        {/* Back */}
        <a
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 shrink-0"
        >
          ← Back
        </a>

        <div className="w-px h-8 bg-gray-200" />

        {/* Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {tools.map((t) => (
            <button
              key={t.value}
              onClick={() => setTool(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tool === t.value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title={t.label}
            >
              <span className="mr-1">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* Colors */}
        <div className="flex items-center gap-1 shrink-0">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                color === c
                  ? "border-blue-500 scale-110"
                  : "border-gray-300 hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 cursor-pointer rounded border-0"
            title="Custom color"
          />
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* Brush Size */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">Size</span>
          <input
            type="range"
            min={MIN_BRUSH_SIZE}
            max={MAX_BRUSH_SIZE}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-500 w-6 text-center">
            {brushSize}
          </span>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          title="Undo"
        >
          ↩ Undo
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share / Invite Code */}
        {inviteCode && (
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors shrink-0"
            title="Copy invite code"
          >
            <span>📋</span>
            <span className="font-mono">{inviteCode}</span>
          </button>
        )}
      </div>
    </div>
  );
}

