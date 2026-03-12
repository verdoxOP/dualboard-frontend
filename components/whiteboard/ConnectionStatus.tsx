"use client";

interface ConnectionStatusProps {
  connected: boolean;
}

export default function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm text-xs">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          connected ? "bg-green-500" : "bg-red-500 animate-pulse"
        }`}
      />
      <span className="text-gray-600">
        {connected ? "Connected" : "Reconnecting..."}
      </span>
    </div>
  );
}

