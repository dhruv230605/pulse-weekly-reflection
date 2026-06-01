import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import History from "../src/pages/History";
import type { Entry } from "../src/lib/types";

const mockEntries: Entry[] = [
  {
    id: "1",
    mood: 4,
    energy: 8,
    note: "Great day",
    tags: ["exercise"],
    timestamp: "2026-05-10T10:00:00Z",
  },
  {
    id: "2",
    mood: 2,
    energy: 3,
    note: "Tired",
    tags: ["stress"],
    timestamp: "2026-05-09T14:00:00Z",
  },
];

const mockList = vi.fn();
const mockDelete = vi.fn();

vi.mock("../src/lib/api", () => ({
  api: {
    entries: {
      list: (...args: unknown[]) => mockList(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

function renderHistory() {
  return render(
    <MemoryRouter>
      <History />
    </MemoryRouter>
  );
}

describe("History", () => {
  beforeEach(() => {
    mockList.mockResolvedValue(mockEntries);
    mockDelete.mockResolvedValue(undefined);
  });

  it("shows loading state initially", () => {
    renderHistory();
    expect(screen.getByText("Loading history...")).toBeInTheDocument();
  });

  it("renders the History heading after loading", async () => {
    renderHistory();
    await waitFor(() => {
      expect(screen.getByText("History")).toBeInTheDocument();
    });
  });

  it("shows total entry count", async () => {
    renderHistory();
    await waitFor(() => {
      expect(screen.getByText("2 total entries")).toBeInTheDocument();
    });
  });

  it("renders entries grouped by date", async () => {
    renderHistory();
    await waitFor(() => {
      expect(screen.getByText("Great day")).toBeInTheDocument();
      expect(screen.getByText("Tired")).toBeInTheDocument();
    });
  });

  it("has a tag filter dropdown", async () => {
    renderHistory();
    await waitFor(() => {
      expect(screen.getByText("All tags")).toBeInTheDocument();
    });
  });

  it("shows 'No entries found' when list is empty", async () => {
    mockList.mockResolvedValue([]);
    renderHistory();
    await waitFor(() => {
      expect(screen.getByText("No entries found.")).toBeInTheDocument();
    });
  });

  it("removes entry from UI when delete is clicked", async () => {
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText("Great day")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete entry");
    await user.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith("1");
    await waitFor(() => {
      expect(screen.queryByText("Great day")).not.toBeInTheDocument();
    });
  });
});
