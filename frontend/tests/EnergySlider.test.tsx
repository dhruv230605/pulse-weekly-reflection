import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EnergySlider from "../src/components/EnergySlider";

describe("EnergySlider", () => {
  it("displays the current energy value", () => {
    render(<EnergySlider value={7} onChange={() => {}} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("/10")).toBeInTheDocument();
  });

  it("renders 10 energy bar buttons", () => {
    render(<EnergySlider value={5} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
  });

  it("calls onChange when an energy bar is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EnergySlider value={5} onChange={onChange} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[7]); // clicking the 8th bar (index 7)
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it("shows Drained and Supercharged labels", () => {
    render(<EnergySlider value={5} onChange={() => {}} />);
    expect(screen.getByText("Drained")).toBeInTheDocument();
    expect(screen.getByText("Supercharged")).toBeInTheDocument();
  });
});
