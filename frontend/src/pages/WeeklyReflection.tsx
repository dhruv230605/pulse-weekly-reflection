import { useEffect, useState } from "react";
import DigestCard from "../components/DigestCard";
import { api } from "../lib/api";
import { loadReflectionAnswer } from "../lib/reflectionAnswer";
import type { WeeklyDigest } from "../lib/types";

export default function WeeklyReflection() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.digest
      .weekly()
      .then((d) => {
        setDigest(d);
        setError(null);
      })
      .catch(() => setError("Couldn't load your reflection. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading your reflection…
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
        {error ?? "No reflection available."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Reflection</h1>
          <p className="text-sm text-gray-500 mt-1">
            A gentle look back — and a nudge to keep your streak alive.
          </p>
        </div>
        {digest.shareable && (
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 bg-pulse-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pulse-700 transition-colors"
          >
            <span aria-hidden>🔗</span>
            Share this week
          </button>
        )}
      </div>

      <DigestCard digest={digest} />

      {shareOpen && (
        <ShareDialog digest={digest} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

function ShareDialog({
  digest,
  onClose,
}: {
  digest: WeeklyDigest;
  onClose: () => void;
}) {
  const saved = loadReflectionAnswer(digest.week_start);
  const hasSavedReflection = !!saved?.text?.trim();

  const [senderName, setSenderName] = useState("");
  const [senderNote, setSenderNote] = useState("");
  const [includeReflection, setIncludeReflection] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.digest.share(digest.week_start, {
        sender_name: senderName.trim() || undefined,
        sender_note: senderNote.trim() || undefined,
        reflection: {
          include: includeReflection && hasSavedReflection,
          text: saved?.text,
        },
      });
      setShareUrl(window.location.origin + res.url);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't create the share link. Try rephrasing your note."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">Share this week</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {shareUrl ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">
              Your read-only link is ready. It expires automatically.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700"
              />
              <button
                onClick={copy}
                className="text-sm font-medium bg-pulse-600 text-white px-3 py-2 rounded-lg hover:bg-pulse-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Your name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Priya"
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pulse-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                A short note <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={senderNote}
                onChange={(e) => setSenderNote(e.target.value)}
                maxLength={280}
                rows={2}
                placeholder="Add a line for whoever you're sharing with…"
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pulse-300"
              />
            </div>

            <label
              className={`flex items-start gap-2 ${
                hasSavedReflection
                  ? "cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <input
                type="checkbox"
                checked={includeReflection}
                disabled={!hasSavedReflection}
                onChange={(e) => setIncludeReflection(e.target.checked)}
                className="mt-1 accent-pulse-600"
              />
              <span className="text-sm text-gray-700">
                Include my reflection note
                <span className="block text-xs text-gray-500">
                  {hasSavedReflection
                    ? "Off by default. Shared only if you check this."
                    : "Save a reflection above first to enable this."}
                </span>
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full bg-pulse-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-pulse-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Creating link…" : "Create share link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
