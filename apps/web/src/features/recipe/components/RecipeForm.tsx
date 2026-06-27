import { type ReactNode } from "react";
import { Button } from "@/shared/components/ui";
import {
  RARITY_OPTIONS,
  DIFFICULTY_OPTIONS,
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";
import type { RecipeFormValues, RecipeFieldErrors } from "@/features/recipe/validation";

interface RecipeFormProps {
  values: RecipeFormValues;
  errors: RecipeFieldErrors;
  onChange: (patch: Partial<RecipeFormValues>) => void;
  onSubmit: () => void;
  submitLabel: string;
  /** 材料・レシピ・メモ（編集画面で表示） */
  withOptional?: boolean;
  /** 写真エリアの表示（登録・編集） */
  withPhoto?: boolean;
  onPickImage?: (file: File) => void;
  analyzing?: boolean;
  /** 写真プレビューURL */
  imagePreviewUrl?: string | null;
  /** フォーム上部の補足（サボ母ちゃん説明など） */
  helper?: ReactNode;
  /** AI認識の通知（失敗メッセージ等） */
  notice?: string | null;
  /** 削除ボタン（編集画面のみ） */
  onDelete?: () => void;
  submitting?: boolean;
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#d33",
  fontSize: 13,
  margin: "4px 0 0",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
  margin: "0 0 6px",
};

/**
 * 料理登録/編集の共通フォーム（プレゼンテーショナル・US-01/US-04）。
 * 状態・送信ロジックは Container（RegisterPage / RecipeEditPage）が保持する。
 */
export function RecipeForm({
  values,
  errors,
  onChange,
  onSubmit,
  submitLabel,
  withOptional = false,
  withPhoto = true,
  onPickImage,
  analyzing = false,
  imagePreviewUrl,
  helper,
  notice,
  onDelete,
  submitting = false,
}: RecipeFormProps) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onPickImage) onPickImage(file);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {helper}

      {withPhoto && (
        <div>
          <label style={labelStyle}>写真</label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 160,
              border: "1px dashed #bbb",
              borderRadius: 10,
              cursor: "pointer",
              background: "#fafafa",
              overflow: "hidden",
            }}
          >
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="料理プレビュー"
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#888" }}>
                {analyzing ? "解析中…" : "タップして撮影／選択"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: "none" }}
              data-testid="recipe-photo-input"
            />
          </label>
          {notice && (
            <p data-testid="recipe-notice" style={{ ...errorStyle, color: "#a60" }}>
              {notice}
            </p>
          )}
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="recipe-name">
          料理名 *
        </label>
        <input
          id="recipe-name"
          type="text"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          style={fieldStyle}
        />
        {errors.name && <p style={errorStyle} role="alert">{errors.name}</p>}
      </div>

      <div>
        <label style={labelStyle} htmlFor="recipe-rarity">
          頻度 *
        </label>
        <select
          id="recipe-rarity"
          value={values.rarity}
          onChange={(e) => onChange({ rarity: e.target.value as RecipeFormValues["rarity"] })}
          style={fieldStyle}
        >
          <option value="">選択してください</option>
          {RARITY_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {FREQUENCY_LABEL[r]}
            </option>
          ))}
        </select>
        {errors.rarity && <p style={errorStyle} role="alert">{errors.rarity}</p>}
      </div>

      <div>
        <label style={labelStyle} htmlFor="recipe-difficulty">
          難易度 *
        </label>
        <select
          id="recipe-difficulty"
          value={values.difficulty}
          onChange={(e) =>
            onChange({ difficulty: e.target.value as RecipeFormValues["difficulty"] })
          }
          style={fieldStyle}
        >
          <option value="">選択してください</option>
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>
        {errors.difficulty && (
          <p style={errorStyle} role="alert">{errors.difficulty}</p>
        )}
      </div>

      <div>
        <label style={labelStyle} htmlFor="recipe-duration">
          所要時間（分） *
        </label>
        <input
          id="recipe-duration"
          type="number"
          min={1}
          value={values.duration}
          onChange={(e) =>
            onChange({
              duration: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
          style={fieldStyle}
        />
        {errors.duration && (
          <p style={errorStyle} role="alert">{errors.duration}</p>
        )}
      </div>

      {withOptional && (
        <>
          <div>
            <label style={labelStyle} htmlFor="recipe-ingredients">
              材料
            </label>
            <textarea
              id="recipe-ingredients"
              value={values.ingredients ?? ""}
              onChange={(e) => onChange({ ingredients: e.target.value })}
              rows={3}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="recipe-recipe">
              レシピ
            </label>
            <textarea
              id="recipe-recipe"
              value={values.recipe ?? ""}
              onChange={(e) => onChange({ recipe: e.target.value })}
              rows={5}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="recipe-memo">
              メモ
            </label>
            <textarea
              id="recipe-memo"
              value={values.memo ?? ""}
              onChange={(e) => onChange({ memo: e.target.value })}
              rows={2}
              style={fieldStyle}
            />
          </div>
        </>
      )}

      <Button type="submit" fullWidth disabled={submitting}>
        {submitLabel}
      </Button>

      {onDelete && (
        <Button type="button" variant="danger" fullWidth onClick={onDelete}>
          🗑 この料理を削除する
        </Button>
      )}
    </form>
  );
}
