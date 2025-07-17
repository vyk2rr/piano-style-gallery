import { render, screen, fireEvent } from "@testing-library/react";
import StyleSwitcherPiano from "./StyleSwitcherPiano";

jest.mock("../PianoBase/PianoBase", () => (props: any) => <div data-testid="piano-base-mock" {...props} />);

describe("StyleSwitcherPiano", () => {
  it("renders all style buttons", () => {
    render(<StyleSwitcherPiano />);
    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.getByText("Rounded")).toBeInTheDocument();
    expect(screen.getByText("Organic")).toBeInTheDocument();
  });

  it("applies 'active' class to the selected style button", () => {
    render(<StyleSwitcherPiano />);
    const classicBtn = screen.getByText("Classic");
    expect(classicBtn.className).toMatch(/active/);
    const roundedBtn = screen.getByText("Rounded");
    fireEvent.click(roundedBtn);
    expect(roundedBtn.className).toMatch(/active/);
    expect(classicBtn.className).toMatch(/inactive/);
  });

  it("renders PianoBase component", () => {
    render(<StyleSwitcherPiano />);
    expect(screen.getByTestId("piano-base-mock")).toBeInTheDocument();
  });

  it("calls setActiveStyle on button click", () => {
    render(<StyleSwitcherPiano />);
    const organicBtn = screen.getByText("Organic");
    fireEvent.click(organicBtn);
    expect(organicBtn.className).toMatch(/active/);
  });
});
