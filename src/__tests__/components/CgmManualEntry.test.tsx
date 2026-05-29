import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CgmManualEntry from "@/components/cgm/CgmManualEntry";
import type { CgmReading } from "@/lib/cgm";

// CgmManualEntry pulls toast at module load; the implementation is a
// noop in tests but we silence the export to avoid console noise.
jest.mock("@/lib/toast", () => ({ showToast: jest.fn() }));

describe("CgmManualEntry", () => {
  it("renders date + value + unit + submit button", () => {
    render(<CgmManualEntry onSubmit={jest.fn()} />);
    expect(screen.getByText(/Ръчно въвеждане/i)).toBeInTheDocument();
    expect(screen.getByText(/Кога/i)).toBeInTheDocument();
    // The "Стойност" label appears in both the field label and the
    // submit button text — pick the field label specifically.
    expect(screen.getByText("Стойност")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Запиши стойност/i })
    ).toBeInTheDocument();
  });

  it("disables submit until a value is typed", async () => {
    render(<CgmManualEntry onSubmit={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /Запиши стойност/i });
    expect(btn).toBeDisabled();
    const valueInput = screen.getByPlaceholderText(/напр\. 110/);
    await userEvent.type(valueInput, "110");
    expect(btn).toBeEnabled();
  });

  it("submits an mg/dL reading as { mgdl, source: 'manual' }", async () => {
    const onSubmit = jest.fn();
    render(<CgmManualEntry onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText(/напр\. 110/), "120");
    await userEvent.click(
      screen.getByRole("button", { name: /Запиши стойност/i })
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const r = onSubmit.mock.calls[0][0] as CgmReading;
    expect(r.mgdl).toBe(120);
    expect(r.source).toBe("manual");
    // ts is a valid ISO string
    expect(() => new Date(r.ts).toISOString()).not.toThrow();
  });

  it("auto-converts mmol/L to mg/dL on submit", async () => {
    const onSubmit = jest.fn();
    render(<CgmManualEntry onSubmit={onSubmit} />);
    // Switch unit first so the placeholder hint flips
    await userEvent.selectOptions(screen.getByRole("combobox"), "mmol/L");
    await userEvent.type(screen.getByPlaceholderText(/напр\. 6\.1/), "5.0");
    await userEvent.click(
      screen.getByRole("button", { name: /Запиши стойност/i })
    );
    const r = onSubmit.mock.calls[0][0] as CgmReading;
    // 5.0 mmol/L × 18.0182 ≈ 90.1 mg/dL
    expect(r.mgdl).toBeCloseTo(90.1, 1);
  });

  it("rejects values outside MGDL_MIN/MAX", async () => {
    const onSubmit = jest.fn();
    render(<CgmManualEntry onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText(/напр\. 110/), "5");
    await userEvent.click(
      screen.getByRole("button", { name: /Запиши стойност/i })
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the value after a successful submit but keeps timestamp ready", async () => {
    const onSubmit = jest.fn();
    render(<CgmManualEntry onSubmit={onSubmit} />);
    const value = screen.getByPlaceholderText(/напр\. 110/) as HTMLInputElement;
    await userEvent.type(value, "115");
    await userEvent.click(
      screen.getByRole("button", { name: /Запиши стойност/i })
    );
    expect(value.value).toBe("");
  });

  it("commits on Enter inside the value input", async () => {
    const onSubmit = jest.fn();
    render(<CgmManualEntry onSubmit={onSubmit} />);
    const value = screen.getByPlaceholderText(/напр\. 110/);
    await userEvent.type(value, "100{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
