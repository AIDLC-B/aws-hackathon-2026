import { Card } from "@/shared/components/ui";
import {
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";
import type { ConfirmedMenuItem } from "@shared/types";

interface MenuItemCardProps {
  item: ConfirmedMenuItem;
  onClick: (item: ConfirmedMenuItem) => void;
}

/**
 * 確定済み献立の一覧カード（US-16）。スナップショット属性を表示する（Q1=A）。
 */
export function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  return (
    <Card
      data-testid={`menu-item-${item.id}`}
      onClick={() => onClick(item)}
      style={{ cursor: "pointer" }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 10,
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 16 }}>{item.name}</strong>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            {FREQUENCY_LABEL[item.rarity]}｜{DIFFICULTY_LABEL[item.difficulty]}｜
            {item.duration}分
          </div>
        </div>
      </div>
    </Card>
  );
}
