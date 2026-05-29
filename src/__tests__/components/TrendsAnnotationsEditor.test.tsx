import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrendsAnnotationsEditor from "@/components/trends/TrendsAnnotationsEditor";

jest.mock("@/lib/toast", () => ({ showToast: jest.fn() }));

// The day-annotations module dynamically imports the server action;
// stub the import target so the storage seam doesn't hit DB stack.
jest.mock("@/lib/actions/day-annotations", () => ({
  saveDayAnnotationAction: jest.fn(async () => ({ ok: true })),
  getDayAnnotationsAction: jest.fn(async () => ({})),
}));

beforeEach(() => {
  window.localStorage.clear();
});

describe("TrendsAnnotationsEditor", () => {
  it("collapsed initially — only the + Анотация link is visible", () => {
    render(<TrendsAnnotationsEditor onChange={jest.fn()} />);
    expect(screen.getByText(/\+ Анотация/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/започнах/i)).not.toBeInTheDocument();
  });

  it("opens the editor on click", async () => {
    render(<TrendsAnnotationsEditor onChange={jest.fn()} />);
    await userEvent.click(screen.getByText(/\+ Анотация/));
    expect(screen.getByPlaceholderText(/започнах кето/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добави/ })).toBeInTheDocument();
  });

  it("disables 'Добави' until a non-empty label is typed", async () => {
    render(<TrendsAnnotationsEditor onChange={jest.fn()} />);
    await userEvent.click(screen.getByText(/\+ Анотация/));
    const addBtn = screen.getByRole("button", { name: /Добави/ });
    expect(addBtn).toBeDisabled();
    await userEvent.type(
      screen.getByPlaceholderText(/започнах/i),
      "ваканция"
    );
    expect(addBtn).toBeEnabled();
  });

  it("saving emits onChange with the new map and shows the chip", async () => {
    const onChange = jest.fn();
    render(<TrendsAnnotationsEditor onChange={onChange} />);
    await userEvent.click(screen.getByText(/\+ Анотация/));
    await userEvent.type(
      screen.getByPlaceholderText(/започнах/i),
      "ваканция"
    );
    await userEvent.click(screen.getByRole("button", { name: /Добави/ }));
    await waitFor(() => {
      expect(screen.getByText("ваканция")).toBeInTheDocument();
    });
    // onChange should have been called at least once with the new entry
    const last = onChange.mock.calls.at(-1)?.[0] as Record<string, string>;
    expect(Object.values(last)).toContain("ваканция");
  });

  it("clicking a chip removes the annotation", async () => {
    // Seed an annotation directly so we don't depend on the save path.
    window.localStorage.setItem(
      "ir-day-annotations-v1",
      JSON.stringify({ "2026-03-01": "ваканция" })
    );
    const onChange = jest.fn();
    render(<TrendsAnnotationsEditor onChange={onChange} />);
    // Chip is rendered; click to remove
    const chip = screen.getByText("ваканция").closest("button");
    expect(chip).not.toBeNull();
    await userEvent.click(chip!);
    await waitFor(() => {
      expect(screen.queryByText("ваканция")).not.toBeInTheDocument();
    });
  });

  it("Enter commits the form", async () => {
    render(<TrendsAnnotationsEditor onChange={jest.fn()} />);
    await userEvent.click(screen.getByText(/\+ Анотация/));
    await userEvent.type(
      screen.getByPlaceholderText(/започнах/i),
      "започнах кето{Enter}"
    );
    await waitFor(() => {
      expect(screen.getByText("започнах кето")).toBeInTheDocument();
    });
  });
});
