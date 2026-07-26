import { useState } from "react";
import { Button, Modal } from "@/shared/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { PremiumSettings } from "@/features/settings/components/PremiumSettings";

/**
 * 設定画面（Unit 8・US-15 / US-18）。
 *
 * ux-design 準拠の3要素:
 *  1. ニックネーム表示（やあ、〇〇！）
 *  2. 推しキャラ設定カード（isPremium で導線が分岐）
 *  3. ログアウト（確認ダイアログ → Firebase Auth からサインアウト）
 *
 * ログアウト後は認証ガード（RequireAuth）が `/login` へリダイレクトするため、
 * 画面側での明示的な遷移は不要。
 */
export function SettingsPage() {
  const { profile, signOut } = useAuth();
  const { isPremium, favoriteCharacters } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div data-testid="settings-page" style={{ padding: 16, display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>設定</h1>
      <p style={{ margin: 0, fontSize: 16 }} data-testid="settings-greeting">
        やあ、{profile?.nickname ?? "あなた"}！
      </p>

      <PremiumSettings
        isPremium={isPremium}
        favoriteCharacters={favoriteCharacters}
      />

      <Button
        variant="ghost"
        fullWidth
        data-testid="logout-button"
        onClick={() => setConfirmOpen(true)}
      >
        ログアウト
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ログアウトしますか？"
      >
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#555" }}>
          またいつでも戻ってきてください。献立は待っています。
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            variant="ghost"
            data-testid="logout-cancel-button"
            onClick={() => setConfirmOpen(false)}
          >
            やめる
          </Button>
          <Button
            variant="danger"
            disabled={signingOut}
            data-testid="logout-confirm-button"
            onClick={handleSignOut}
          >
            ログアウト
          </Button>
        </div>
      </Modal>
    </div>
  );
}
