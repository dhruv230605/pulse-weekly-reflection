import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Layout from "../src/components/Layout";

describe("Layout", () => {
  it("renders the app name", () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(screen.getByText("Pulse")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Log Entry")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>My child content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(screen.getByText("My child content")).toBeInTheDocument();
  });

  it("renders the footer", () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Pulse — Mood & Energy Tracker/)
    ).toBeInTheDocument();
  });
});
