import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecipeForm } from "@/features/recipe/components/RecipeForm";
import { emptyRecipeForm } from "@/features/recipe/validation";

describe("RecipeForm（プレゼンテーショナル）", () => {
  it("フィールド別エラーを表示する", () => {
    render(
      <RecipeForm
        values={emptyRecipeForm}
        errors={{
          name: "料理名は必須です",
          duration: "所要時間は必須です",
        }}
        onChange={() => {}}
        onSubmit={() => {}}
        submitLabel="登録する"
      />,
    );
    expect(screen.getByText("料理名は必須です")).toBeInTheDocument();
    expect(screen.getByText("所要時間は必須です")).toBeInTheDocument();
  });

  it("頻度セレクトに頻度表記が並ぶ", () => {
    render(
      <RecipeForm
        values={emptyRecipeForm}
        errors={{}}
        onChange={() => {}}
        onSubmit={() => {}}
        submitLabel="登録する"
      />,
    );
    expect(screen.getByText("よく作る")).toBeInTheDocument();
    expect(screen.getByText("まれに作る")).toBeInTheDocument();
  });

  it("送信ボタンで onSubmit が呼ばれる", () => {
    const onSubmit = vi.fn();
    render(
      <RecipeForm
        values={emptyRecipeForm}
        errors={{}}
        onChange={() => {}}
        onSubmit={onSubmit}
        submitLabel="登録する"
      />,
    );
    fireEvent.click(screen.getByText("登録する"));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("料理名入力で onChange が呼ばれる", () => {
    const onChange = vi.fn();
    render(
      <RecipeForm
        values={emptyRecipeForm}
        errors={{}}
        onChange={onChange}
        onSubmit={() => {}}
        submitLabel="登録する"
      />,
    );
    fireEvent.change(screen.getByLabelText("料理名 *"), {
      target: { value: "カレー" },
    });
    expect(onChange).toHaveBeenCalledWith({ name: "カレー" });
  });

  it("withOptional=false では材料・レシピ・メモを表示しない", () => {
    render(
      <RecipeForm
        values={emptyRecipeForm}
        errors={{}}
        onChange={() => {}}
        onSubmit={() => {}}
        submitLabel="登録する"
      />,
    );
    expect(screen.queryByLabelText("材料")).not.toBeInTheDocument();
  });
});
