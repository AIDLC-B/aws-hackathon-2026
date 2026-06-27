import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RerollLimitScreen } from "@/features/gacha/components/RerollLimitScreen";
import { DELIVERY_URL } from "@/features/gacha/config";

describe("RerollLimitScreen（堕落ルート・US-11）", () => {
  it("メシストフェレスの一言とデリバリー誘導リンクを表示する", () => {
    render(<RerollLimitScreen onBack={() => {}} />);
    expect(screen.getByTestId("reroll-limit-screen")).toBeInTheDocument();
    const link = screen.getByTestId("delivery-link");
    expect(link).toHaveAttribute("href", DELIVERY_URL);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("「やっぱり作る」で onBack が発火する", () => {
    const onBack = vi.fn();
    render(<RerollLimitScreen onBack={onBack} />);
    fireEvent.click(screen.getByTestId("reroll-limit-back-button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
