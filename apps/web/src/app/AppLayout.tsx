import { NavLink, Outlet } from "react-router-dom";

/**
 * タブ付きレイアウト（ボトムナビゲーション・Unit 5）。
 * 🏠ホーム（Unit 6）/ 🍳レシピ（Unit 5）/ ⚙設定（Unit 8）。
 * レシピのサブ画面（登録/詳細/編集）はナビ無しの単独ルートで表示する。
 */
const TABS = [
  { to: "/", emoji: "🏠", label: "ホーム" },
  { to: "/recipe", emoji: "🍳", label: "レシピ" },
  { to: "/settings", emoji: "⚙", label: "設定" },
];

export function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 64 }}>
      <Outlet />
      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: 60,
          display: "flex",
          borderTop: "1px solid #eee",
          background: "#fff",
          zIndex: 900,
        }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            style={({ isActive }) => ({
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              fontSize: 12,
              textDecoration: "none",
              color: isActive ? "#ff7043" : "#888",
            })}
          >
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
