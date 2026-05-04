// src/app/trade-details/[id]/DeleteTradeButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/sanity/trade/${tradeId}/delete`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to delete trade");
        setLoading(false);
        setConfirming(false);
        return;
      }

      router.push("/trade-details");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trade");
      setLoading(false);
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-red-400">{error}</span>
        <button
          onClick={() => setError("")}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-300">Are you sure?</span>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </button>

        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
    >
      🗑️ Delete
    </button>
  );
}