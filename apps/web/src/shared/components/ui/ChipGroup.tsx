interface ChipOption<T extends string | number> {
  value: T;
  label: string;
  /** 補助表示（絵文字など） */
  emoji?: string;
}

interface ChipGroupProps<T extends string | number> {
  options: ChipOption<T>[];
  value: T | "";
  onSelect: (value: T) => void;
  /** 1行に詰め込まず等分割で並べる（選択肢が3つ程度のとき） */
  equalWidth?: boolean;
  "data-testid"?: string;
}

/**
 * 選択肢をタップで選ぶチップ群（UI Element）。
 *
 * `<select>` は「選択してください」を開いて選ぶ2アクションが必要で、
 * 「考えない」ことを売りにするアプリの入力としては重い。1タップで決まるチップに置き換える。
 */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onSelect,
  equalWidth = false,
  "data-testid": testId,
}: ChipGroupProps<T>) {
  return (
    <div
      data-testid={testId}
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(o.value)}
            style={{
              flex: equalWidth ? 1 : undefined,
              minWidth: equalWidth ? 0 : undefined,
              padding: "9px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: selected ? "#ff7043" : "#fff",
              color: selected ? "#fff" : "#666",
              border: `1.5px solid ${selected ? "#ff7043" : "#ddd"}`,
              transition: "background 0.12s ease, color 0.12s ease",
            }}
          >
            {o.emoji ? `${o.emoji} ` : ""}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
