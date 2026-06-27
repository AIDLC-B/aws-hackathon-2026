import { describe, it, expect } from "vitest";
import {
  validateRecipeForm,
  isValidRecipeForm,
  toRecipeInput,
  emptyRecipeForm,
  type RecipeFormValues,
} from "@/features/recipe/validation";

const valid: RecipeFormValues = {
  name: "カレー",
  rarity: "R",
  difficulty: "normal",
  duration: 30,
  imageUrl: null,
  ingredients: "",
  recipe: "",
  memo: "",
};

describe("validateRecipeForm", () => {
  it("空フォームは4つの必須エラーを返す", () => {
    const errors = validateRecipeForm(emptyRecipeForm);
    expect(errors.name).toBe("料理名は必須です");
    expect(errors.rarity).toBe("頻度は必須です");
    expect(errors.difficulty).toBe("難易度は必須です");
    expect(errors.duration).toBe("所要時間は必須です");
  });

  it("全項目入力済みならエラーなし", () => {
    expect(validateRecipeForm(valid)).toEqual({});
    expect(isValidRecipeForm(valid)).toBe(true);
  });

  it("料理名が空白のみは必須エラー", () => {
    expect(validateRecipeForm({ ...valid, name: "   " }).name).toBe(
      "料理名は必須です",
    );
  });

  it("所要時間0以下は必須エラー", () => {
    expect(validateRecipeForm({ ...valid, duration: 0 }).duration).toBe(
      "所要時間は必須です",
    );
  });

  it("所要時間が空文字は必須エラー", () => {
    expect(validateRecipeForm({ ...valid, duration: "" }).duration).toBe(
      "所要時間は必須です",
    );
  });
});

describe("toRecipeInput", () => {
  it("必須項目を変換し、任意項目は空なら省略する", () => {
    const input = toRecipeInput(valid);
    expect(input).toEqual({
      name: "カレー",
      rarity: "R",
      difficulty: "normal",
      duration: 30,
      imageUrl: null,
    });
    expect("ingredients" in input).toBe(false);
  });

  it("任意項目があれば含める（trim済み）", () => {
    const input = toRecipeInput({
      ...valid,
      ingredients: " 玉ねぎ ",
      recipe: "煮る",
      memo: "辛口",
    });
    expect(input.ingredients).toBe("玉ねぎ");
    expect(input.recipe).toBe("煮る");
    expect(input.memo).toBe("辛口");
  });

  it("料理名はtrimされる", () => {
    expect(toRecipeInput({ ...valid, name: "  親子丼 " }).name).toBe("親子丼");
  });
});
