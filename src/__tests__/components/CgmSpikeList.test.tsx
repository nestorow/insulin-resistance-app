import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CgmSpikeList from "@/components/cgm/CgmSpikeList";
import type { GlucoseSpike } from "@/lib/cgm-stats";

jest.mock("@/lib/toast", () => ({ showToast: jest.fn() }));

function spike(over: Partial<GlucoseSpike> = {}): GlucoseSpike {
  return {
    peakTs: "2026-05-20T08:30:00.000Z",
    peakMgdl: 150,
    baselineMgdl: 90,
    riseMgdl: 60,
    riseDurationMin: 30,
    ...over,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("CgmSpikeList", () => {
  it("empty state copy frames zero spikes as a positive signal", () => {
    render(<CgmSpikeList spikes={[]} />);
    expect(screen.getByText(/Открити пикове \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Няма пикове/)).toBeInTheDocument();
    expect(screen.getByText(/insulin sensitivity/i)).toBeInTheDocument();
  });

  it("renders each spike with peak / baseline / rise / duration", () => {
    render(
      <CgmSpikeList
        spikes={[
          spike({ peakMgdl: 165, baselineMgdl: 95, riseMgdl: 70, riseDurationMin: 45 }),
        ]}
      />
    );
    expect(screen.getByText(/\+70 mg\/dL/)).toBeInTheDocument();
    expect(screen.getByText(/пик 165 от baseline 95/)).toBeInTheDocument();
    expect(screen.getByText(/за 45 мин/)).toBeInTheDocument();
  });

  it("severity coloring — rise ≥80 is rose", () => {
    render(<CgmSpikeList spikes={[spike({ riseMgdl: 90 })]} />);
    const badge = screen.getByText(/\+90 mg\/dL/);
    expect(badge.className).toMatch(/rose/);
  });

  it("severity coloring — rise 60-79 is amber", () => {
    render(<CgmSpikeList spikes={[spike({ riseMgdl: 65 })]} />);
    const badge = screen.getByText(/\+65 mg\/dL/);
    expect(badge.className).toMatch(/amber/);
  });

  it("severity coloring — rise <60 is teal", () => {
    render(<CgmSpikeList spikes={[spike({ riseMgdl: 45 })]} />);
    const badge = screen.getByText(/\+45 mg\/dL/);
    expect(badge.className).toMatch(/teal/);
  });

  it("clicking 'add note' opens an inline editor", async () => {
    render(<CgmSpikeList spikes={[spike()]} />);
    const addBtn = screen.getByText(/\+ добави бележка/);
    await userEvent.click(addBtn);
    expect(
      screen.getByPlaceholderText(/Какво яде/i)
    ).toBeInTheDocument();
  });

  it("saving a note replaces the editor with the chip", async () => {
    render(<CgmSpikeList spikes={[spike()]} />);
    await userEvent.click(screen.getByText(/\+ добави бележка/));
    const input = screen.getByPlaceholderText(/Какво яде/i);
    await userEvent.type(input, "банан + кафе");
    await userEvent.click(screen.getByRole("button", { name: /Запази/i }));
    // The chip with the saved note appears
    expect(screen.getByText(/банан \+ кафе/)).toBeInTheDocument();
    // The placeholder editor is gone
    expect(screen.queryByPlaceholderText(/Какво яде/i)).not.toBeInTheDocument();
  });

  it("Escape cancels the editor without saving", async () => {
    render(<CgmSpikeList spikes={[spike()]} />);
    await userEvent.click(screen.getByText(/\+ добави бележка/));
    const input = screen.getByPlaceholderText(/Какво яде/i);
    await userEvent.type(input, "пица{Escape}");
    expect(screen.queryByPlaceholderText(/Какво яде/i)).not.toBeInTheDocument();
    // No chip appeared
    expect(screen.queryByText(/🍴/)).not.toBeInTheDocument();
  });
});
