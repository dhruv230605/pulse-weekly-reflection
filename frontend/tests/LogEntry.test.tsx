import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LogEntry from "../src/pages/LogEntry";

const mockCreate = vi.fn();
const mockTags = vi.fn();

vi.mock("../src/lib/api", () => ({
  api: {
    entries: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    tags: (...args: unknown[]) => mockTags(...args),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogEntry() {
  return render(
    <MemoryRouter>
      <LogEntry />
    </MemoryRouter>
  );
}

describe("LogEntry", () => {
  beforeEach(() => {
    mockTags.mockResolvedValue({ predefined: ["sleep", "exercise"], custom: [] });
    mockCreate.mockResolvedValue({
      id: "new-id",
      mood: 3,
      energy: 5,
      note: null,
      tags: [],
      timestamp: "2026-05-10T12:00:00Z",
    });
    mockNavigate.mockClear();
  });

  it("renders the Log Entry heading", async () => {
    renderLogEntry();
    await waitFor(() => {
      expect(screen.getByText("Log Entry")).toBeInTheDocument();
    });
  });

  it("renders mood selector, energy slider, and tag selector", async () => {
    renderLogEntry();
    await waitFor(() => {
      expect(screen.getByText("How are you feeling?")).toBeInTheDocument();
      expect(screen.getByText(/Energy level/)).toBeInTheDocument();
      expect(screen.getByText(/What's influencing you/)).toBeInTheDocument();
    });
  });

  it("renders the submit button", async () => {
    renderLogEntry();
    await waitFor(() => {
      expect(screen.getByText("Log this entry")).toBeInTheDocument();
    });
  });

  it("shows note textarea with character count", async () => {
    renderLogEntry();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
      expect(screen.getByText("0/500")).toBeInTheDocument();
    });
  });

  it("updates character count as user types", async () => {
    const user = userEvent.setup();
    renderLogEntry();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, "Hello");
    expect(screen.getByText("5/500")).toBeInTheDocument();
  });

  it("submits the form and shows success", async () => {
    const user = userEvent.setup();
    renderLogEntry();

    await waitFor(() => {
      expect(screen.getByText("Log this entry")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Log this entry"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(screen.getByText("Logged!")).toBeInTheDocument();
    });
  });

  it("loads available tags on mount", async () => {
    renderLogEntry();
    await waitFor(() => {
      expect(screen.getByText(/sleep/)).toBeInTheDocument();
      expect(screen.getByText(/exercise/)).toBeInTheDocument();
    });
  });
});
