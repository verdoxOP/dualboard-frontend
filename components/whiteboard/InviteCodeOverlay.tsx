"use client";

import { useEffect, useState } from "react";

interface InviteCodeOverlayProps {
  inviteCode?: string;
}

export default function InviteCodeOverlay({ inviteCode }: InviteCodeOverlayProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy invite code:", error);
    }
  };

  if (!inviteCode) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute top-14 right-3 z-20 sm:right-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm sm:text-sm">
        <span className="text-gray-500">Invite code:</span>
        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono font-semibold tracking-wider text-gray-800">
          {inviteCode}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700 transition-colors hover:bg-blue-100"
          aria-live="polite"
          aria-label={copied ? "Invite code copied" : "Copy invite code"}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

