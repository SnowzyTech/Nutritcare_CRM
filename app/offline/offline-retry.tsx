"use client";

import React, { useEffect, useState } from "react";

/**
 * Retry control for the offline page. `location.reload()` would just re-serve
 * the cached offline document, so this navigates afresh once the browser
 * reports a connection again.
 */
export function OfflineRetry() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <div className="mt-6">
      <button
        onClick={() => window.location.assign("/")}
        className="w-full px-4 py-2.5 rounded-xl bg-[#ad1df4] text-white text-sm font-semibold hover:bg-[#9615d6] transition-colors"
      >
        Try again
      </button>
      <p className="text-[11px] text-gray-400 mt-3">
        {online ? "Connection detected — tap to reload." : "Still waiting for a connection…"}
      </p>
    </div>
  );
}
