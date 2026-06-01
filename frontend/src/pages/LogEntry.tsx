import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EnergySlider from "../components/EnergySlider";
import MoodSelector from "../components/MoodSelector";
import TagSelector from "../components/TagSelector";
import { api } from "../lib/api";

export default function LogEntry() {
  const navigate = useNavigate();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(5);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.tags().then((t) => setAvailableTags([...t.predefined, ...t.custom]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.entries.create({
        mood,
        energy,
        note: note.trim() || undefined,
        tags,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <span className="text-6xl mb-4">✅</span>
        <h2 className="text-xl font-bold text-gray-800">Logged!</h2>
        <p className="text-sm text-gray-500 mt-1">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Log Entry</h1>
      <p className="text-sm text-gray-500 mb-6">
        How are you feeling right now?
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <MoodSelector value={mood} onChange={setMood} />
        <EnergySlider value={energy} onChange={setEnergy} />
        <TagSelector
          available={availableTags}
          selected={tags}
          onChange={setTags}
        />

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-pulse-400 focus:border-pulse-400
                       resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {note.length}/500
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-pulse-600 text-white font-semibold
                     hover:bg-pulse-700 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Saving..." : "Log this entry"}
        </button>
      </form>
    </div>
  );
}
