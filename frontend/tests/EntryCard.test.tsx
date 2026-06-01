import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EntryCard from "../src/components/EntryCard";
import type { Entry } from "../src/lib/types";

const mockEntry: Entry = {
  id: "test-id-1",
  mood: 4,
  energy: 8,
  note: "Had a productive day",
  tags: ["exercise", "deep-work"],
  timestamp: "2026-05-10T12:00:00Z",
};

describe("EntryCard", () => {
  it("renders mood and energy", () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText("Mood: 4/5")).toBeInTheDocument();
    expect(screen.getByText("Energy: 8/10")).toBeInTheDocument();
  });

  it("renders mood emoji", () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText("🙂")).toBeInTheDocument();
  });

  it("renders note when present", () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText("Had a productive day")).toBeInTheDocument();
  });

  it("does not render note when null", () => {
    const entryNoNote = { ...mockEntry, note: null };
    render(<EntryCard entry={entryNoNote} />);
    expect(screen.queryByText("Had a productive day")).not.toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText("exercise")).toBeInTheDocument();
    expect(screen.getByText("deep-work")).toBeInTheDocument();
  });

  it("shows delete button when onDelete is provided", () => {
    render(<EntryCard entry={mockEntry} onDelete={() => {}} />);
    expect(screen.getByTitle("Delete entry")).toBeInTheDocument();
  });

  it("does not show delete button when onDelete is not provided", () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.queryByTitle("Delete entry")).not.toBeInTheDocument();
  });

  it("calls onDelete with entry id when delete is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<EntryCard entry={mockEntry} onDelete={onDelete} />);

    await user.click(screen.getByTitle("Delete entry"));
    expect(onDelete).toHaveBeenCalledWith("test-id-1");
  });
});
