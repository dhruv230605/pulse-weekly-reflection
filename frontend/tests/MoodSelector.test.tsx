import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MoodSelector from "../src/components/MoodSelector";

describe("MoodSelector", () => {
  it("renders all 5 mood buttons", () => {
    render(<MoodSelector value={3} onChange={() => {}} />);
    expect(screen.getByText("😢")).toBeInTheDocument();
    expect(screen.getByText("😕")).toBeInTheDocument();
    expect(screen.getByText("😐")).toBeInTheDocument();
    expect(screen.getByText("🙂")).toBeInTheDocument();
    expect(screen.getByText("😄")).toBeInTheDocument();
  });

  it("renders mood labels", () => {
    render(<MoodSelector value={3} onChange={() => {}} />);
    expect(screen.getByText("Awful")).toBeInTheDocument();
    expect(screen.getByText("Bad")).toBeInTheDocument();
    expect(screen.getByText("Okay")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Great")).toBeInTheDocument();
  });

  it("calls onChange when a mood button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoodSelector value={3} onChange={onChange} />);

    await user.click(screen.getByText("😄"));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("displays the question label", () => {
    render(<MoodSelector value={3} onChange={() => {}} />);
    expect(screen.getByText("How are you feeling?")).toBeInTheDocument();
  });
});
