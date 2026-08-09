import type { Metadata } from "next";
import { OfflineRetry } from "./offline-retry";

export const metadata: Metadata = { title: "You're offline" };

/**
 * Served by the service worker when a navigation fails with no connection.
 * Must stay a static, dependency-free page: it is precached at install time,
 * so anything dynamic here would be frozen at whatever the value was then.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F6E8FF] flex items-center justify-center mx-auto mb-5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ad1df4"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
            aria-hidden="true"
          >
            <path d="M2 2l20 20" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M5 12.86a10 10 0 0 1 4.14-2.4" />
            <path d="M14.86 10.46A10 10 0 0 1 19 12.86" />
            <path d="M1.42 9a15.9 15.9 0 0 1 5.2-3.35" />
            <path d="M11 3.05A16 16 0 0 1 22.58 9" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900">You&apos;re offline</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Nutricare needs a connection to load your work. Check your mobile data or Wi-Fi, then try
          again — nothing you had open has been lost.
        </p>

        <OfflineRetry />
      </div>
    </div>
  );
}
