import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DigestCard from "../components/DigestCard";
import { api } from "../lib/api";
import type { SharedDigest as SharedDigestType } from "../lib/types";

export default function SharedDigest() {
  const { token } = useParams<{ token: string }>();
  const [digest, setDigest] = useState<SharedDigestType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.digest
      .shared(token)
      .then((d) => {
        setDigest(d);
        setError(null);
      })
      .catch(() => setError("This link is no longer available — it may have expired or been revoked."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-center">
        {error ?? "Not found."}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Shared with you
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          {digest.sender_name
            ? `${digest.sender_name}'s week`
            : "A weekly reflection"}
        </h1>
      </div>

      {digest.sender_note && (
        <div className="bg-pulse-50 border border-pulse-200 rounded-xl p-4">
          <p className="text-sm text-gray-800 leading-relaxed">
            {digest.sender_note}
          </p>
          {digest.sender_name && (
            <p className="text-xs text-gray-500 mt-2">— {digest.sender_name}</p>
          )}
        </div>
      )}

      <DigestCard digest={digest} publicView />

      {digest.reflection && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
            {digest.sender_name
              ? `${digest.sender_name}'s reflection`
              : "Their reflection"}
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed italic">
            “{digest.reflection}”
          </p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pt-2">
        Shared via Pulse · read-only
      </p>
    </div>
  );
}
