import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@yugen/backend/convex/_generated/api";

const IS_PRODUCTION =
  typeof window !== "undefined" &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1");

/**
 * Development-only widget for clearing auth sessions and other dev utilities.
 * This widget only renders in local development environments.
 */
export function DevToolsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const clearSessions = useMutation(api.devTools.clearAllSessions);

  // Don't render in production
  if (IS_PRODUCTION) {
    return null;
  }

  const handleClearSessions = async () => {
    if (
      !window.confirm(
        "This will log out all users and clear all sessions. Continue?"
      )
    ) {
      return;
    }

    setIsClearing(true);
    setMessage(null);

    try {
      const result = await clearSessions();
      setMessage(`Cleared ${result.deletedCount} sessions`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="rounded-lg border border-yellow-500/50 bg-zinc-900 p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-sm font-bold text-yellow-500">
              Dev Tools
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <title>Close</title>
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleClearSessions}
              disabled={isClearing}
              className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClearing ? "Clearing..." : "Clear All Sessions"}
            </button>

            {message && (
              <p
                className={`text-xs ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
              >
                {message}
              </p>
            )}

            <p className="text-xs text-zinc-500">
              Use this to fix schema validation errors from stale session data.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full border border-yellow-500/50 bg-zinc-900 p-3 text-yellow-500 shadow-lg transition-colors hover:bg-zinc-800"
          title="Dev Tools"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <title>Dev Tools</title>
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
