import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TagSelector from "../src/components/TagSelector";

describe("TagSelector", () => {
  const tags = ["sleep", "exercise", "caffeine"];

  it("renders all available tags", () => {
    render(<TagSelector available={tags} selected={[]} onChange={() => {}} />);
    expect(screen.getByText(/sleep/)).toBeInTheDocument();
    expect(screen.getByText(/exercise/)).toBeInTheDocument();
    expect(screen.getByText(/caffeine/)).toBeInTheDocument();
  });

  it("calls onChange with added tag when clicking unselected tag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagSelector available={tags} selected={[]} onChange={onChange} />);

    await user.click(screen.getByText(/exercise/));
    expect(onChange).toHaveBeenCalledWith(["exercise"]);
  });

  it("calls onChange without tag when clicking selected tag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TagSelector
        available={tags}
        selected={["sleep", "exercise"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByText(/sleep/));
    expect(onChange).toHaveBeenCalledWith(["exercise"]);
  });

  it("displays the label text", () => {
    render(<TagSelector available={tags} selected={[]} onChange={() => {}} />);
    expect(screen.getByText(/What's influencing you/)).toBeInTheDocument();
  });
});
