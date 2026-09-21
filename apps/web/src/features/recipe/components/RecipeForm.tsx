import { type ReactNode } from "react";
import { Button, ChipGroup } from "@/shared/components/ui";
import {
  RARITY_OPTIONS,
  DIFFICULTY_OPTIONS,
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";
import type { Difficulty, Rarity } from "@shared/types";
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
  /** フォーム上部の補足（サボ母ちゃんの案内など） */
  helper?: ReactNode;
  /** AI認識の通知（失敗メッセージ等） */
  notice?: string | null;
  /** 削除ボタン（編集画面のみ） */
  onDelete?: () => void;
  submitting?: boolean;
}

/** 所要時間のプリセット（分）。ここに無い値は数値入力で指定する */
const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

/** 頻度チップの絵文字（よく作る → まれに作る） */
const RARITY_EMOJI: Record<Rarity, string> = {
  N: "🔁",
  R: "🙂",
  SR: "🌙",
  SSR: "✨",
};

/** 難易度チップの絵文字 */
const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: "😌",
  normal: "🙂",
  hard: "🔥",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  fontSize: 16,
  borderRadius: 10,
  border: "1.5px solid #e0dcd9",
  background: "#fff",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#d33",
  fontSize: 13,
  margin: "6px 0 0",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  fontSize: 14,
  margin: "0 0 8px",
};

/** 必須マーク付きのセクション見出し */
function Field({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle} htmlFor={htmlFor}>
        {label}
        {required && (
          <span style={{ color: "#ff7043", marginLeft: 4 }} aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 料理登録/編集の共通フォーム（プレゼンテーショナル・US-01/US-04）。
 * 状態・送信ロジックは Container（RegisterPage / RecipeEditPage）が保持する。
 *
 * 入力を「1タップで終わる」形に寄せている:
 * - 頻度・難易度・所要時間はチップ選択（`<select>` の開く→選ぶの2アクションを避ける）
 * - 所要時間はプリセットに無い場合のみ数値入力
 * - 写真は主導線（AI認識）として目立たせ、未選択時も何が起きるか分かる文言を置く
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

  const durationIsPreset =
    typeof values.duration === "number" &&
    DURATION_PRESETS.includes(values.duration);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {helper}

      {withPhoto && (
        <div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: imagePreviewUrl ? undefined : 132,
              padding: imagePreviewUrl ? 0 : 20,
              border: imagePreviewUrl ? "none" : "2px dashed #ffc4ad",
              borderRadius: 14,
              cursor: "pointer",
              background: imagePreviewUrl ? "transparent" : "#fff6f2",
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            {imagePreviewUrl ? (
              <>
                <img
                  src={imagePreviewUrl}
                  alt="料理プレビュー"
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 14,
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: "#ff7043",
                    fontWeight: 600,
                    padding: "8px 0 0",
                  }}
                >
                  {analyzing ? "🤖 解析中…" : "写真を撮り直す"}
                </span>
              </>
            ) : analyzing ? (
              <>
                <span style={{ fontSize: 32 }} aria-hidden>
                  🤖
                </span>
                <strong style={{ fontSize: 15, color: "#ff7043" }}>
                  解析中…
                </strong>
              </>
            ) : (
              <>
                <span style={{ fontSize: 32 }} aria-hidden>
                  📷
                </span>
                <strong style={{ fontSize: 15, color: "#ff7043" }}>
                  写真から登録する
                </strong>
                <span style={{ fontSize: 12, color: "#a08a80", lineHeight: 1.6 }}>
                  撮るだけでAIが料理名を埋めてくれます
                  <br />
                  （手入力だけでもOK）
                </span>
              </>
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

      <Field label="料理名 *" htmlFor="recipe-name" error={errors.name}>
        <input
          id="recipe-name"
          type="text"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="例: カレーライス"
          style={fieldStyle}
        />
      </Field>

      <Field label="どれくらい作る？" required error={errors.rarity}>
        <ChipGroup
          data-testid="recipe-rarity-chips"
          options={RARITY_OPTIONS.map((r) => ({
            value: r,
            label: FREQUENCY_LABEL[r],
            emoji: RARITY_EMOJI[r],
          }))}
          value={values.rarity}
          onSelect={(v) => onChange({ rarity: v })}
        />
      </Field>

      <Field label="どれくらい大変？" required error={errors.difficulty}>
        <ChipGroup
          data-testid="recipe-difficulty-chips"
          equalWidth
          options={DIFFICULTY_OPTIONS.map((d) => ({
            value: d,
            label: DIFFICULTY_LABEL[d],
            emoji: DIFFICULTY_EMOJI[d],
          }))}
          value={values.difficulty}
          onSelect={(v) => onChange({ difficulty: v })}
        />
      </Field>

      <Field
        label="どれくらい時間がかかる？"
        required
        error={errors.duration}
      >
        <ChipGroup
          data-testid="recipe-duration-chips"
          options={DURATION_PRESETS.map((m) => ({
            value: m,
            label: `${m}分`,
          }))}
          value={durationIsPreset ? (values.duration as number) : ""}
          onSelect={(v) => onChange({ duration: v })}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <label
            htmlFor="recipe-duration"
            style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap" }}
          >
            直接入力（分）
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
            style={{ ...fieldStyle, flex: 1 }}
          />
        </div>
      </Field>

      {withOptional && (
        <>
          <Field label="材料" htmlFor="recipe-ingredients">
            <textarea
              id="recipe-ingredients"
              value={values.ingredients ?? ""}
              onChange={(e) => onChange({ ingredients: e.target.value })}
              rows={3}
              style={fieldStyle}
            />
          </Field>
          <Field label="レシピ" htmlFor="recipe-recipe">
            <textarea
              id="recipe-recipe"
              value={values.recipe ?? ""}
              onChange={(e) => onChange({ recipe: e.target.value })}
              rows={5}
              style={fieldStyle}
            />
          </Field>
          <Field label="メモ" htmlFor="recipe-memo">
            <textarea
              id="recipe-memo"
              value={values.memo ?? ""}
              onChange={(e) => onChange({ memo: e.target.value })}
              rows={2}
              style={fieldStyle}
            />
          </Field>
        </>
      )}

      {/* 送信は画面下に固定し、スクロール位置に関係なく押せるようにする */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          padding: "12px 0 8px",
          background:
            "linear-gradient(to top, #fff 60%, rgba(255,255,255,0))",
        }}
      >
        <Button type="submit" fullWidth disabled={submitting}>
          {submitLabel}
        </Button>
      </div>

      {onDelete && (
        <Button type="button" variant="danger" fullWidth onClick={onDelete}>
          🗑 この料理を削除する
        </Button>
      )}
    </form>
  );
}
