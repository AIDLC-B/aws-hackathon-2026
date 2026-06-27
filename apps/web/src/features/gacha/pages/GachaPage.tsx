import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "@/shared/components/ui";
import { CharacterBottomSheet } from "@/features/character/components/CharacterBottomSheet";
import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import { useGacha, type ConfirmMode } from "@/features/gacha/hooks/useGacha";
import { GachaSpinner } from "@/features/gacha/components/GachaSpinner";
import { GachaResult } from "@/features/gacha/components/GachaResult";
import { RerollLimitScreen } from "@/features/gacha/components/RerollLimitScreen";

/** 演出の表示時間（ms・Q3=A） */
const ANIM_MS = 1300;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = "idle" | "spinning" | "result" | "reroll_limit";

/**
 * 献立ガチャ画面（US-10/11/12）。
 *
 * フェーズ遷移: idle（スピン待ち）→ spinning（カプセル演出）→ result（結果）。
 * result から「もう一度」でリセマラ（5回目で reroll_limit=堕落ルート）、
 * 「これにする！」で確定（10連かつ既存献立ありなら追加/入れ替えダイアログ）。
 * 確定後はキャラ一言（gacha_decided）を表示し、閉じたらホームへ（件数分岐で詳細/リストへ）。
 */
export function GachaPage() {
  const navigate = useNavigate();
  const { count: confirmedCount } = useConfirmedMenu();
  const {
    results,
    lastCount,
    error,
    spin,
    reroll,
    backToResult,
    confirmGachaResult,
  } = useGacha();

  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [decidedOpen, setDecidedOpen] = useState(false);

  async function handleSpin(count: 1 | 10) {
    setPhase("spinning");
    try {
      await Promise.all([spin(count), delay(ANIM_MS)]);
      setPhase("result");
    } catch {
      setPhase("idle");
    }
  }

  async function handleReroll() {
    setPhase("spinning");
    try {
      const [limited] = await Promise.all([reroll(), delay(ANIM_MS)]);
      setPhase(limited ? "reroll_limit" : "result");
    } catch {
      setPhase("result");
    }
  }

  function handleConfirm() {
    // 10連かつ既存献立がある場合は追加/入れ替えを選択（US-12）
    if (lastCount === 10 && confirmedCount > 0) {
      setShowModeDialog(true);
      return;
    }
    void doConfirm("add");
  }

  async function doConfirm(mode: ConfirmMode) {
    setBusy(true);
    try {
      await confirmGachaResult(mode);
      setShowModeDialog(false);
      setDecidedOpen(true);
    } catch {
      setBusy(false);
    }
  }

  return (
    <main data-testid="gacha-page" style={{ padding: 16, paddingBottom: 80 }}>
      <Button variant="ghost" onClick={() => navigate("/")}>
        ← もどる
      </Button>

      <h1 style={{ fontSize: 20, margin: "8px 0 16px" }}>献立ガチャ</h1>

      {phase === "idle" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <GachaSpinner label="運に任せて、今日の献立を決めよう！" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <Button
              fullWidth
              data-testid="gacha-spin-button"
              onClick={() => handleSpin(1)}
            >
              🎰 ガチャを回す！
            </Button>
            <Button
              fullWidth
              variant="secondary"
              data-testid="gacha-spin10-button"
              onClick={() => handleSpin(10)}
            >
              ✨ 10連ガチャ
            </Button>
          </div>
          {error && (
            <p data-testid="gacha-error" style={{ color: "#e53935" }}>
              ガチャに失敗しました。時間をおいて再度お試しください。
            </p>
          )}
        </div>
      )}

      {phase === "spinning" && <GachaSpinner count={lastCount} />}

      {phase === "result" && (
        <GachaResult
          results={results}
          onConfirm={handleConfirm}
          onReroll={handleReroll}
          busy={busy}
        />
      )}

      {phase === "reroll_limit" && (
        <RerollLimitScreen
          onBack={() => {
            backToResult();
            setPhase("result");
          }}
        />
      )}

      {/* 10連の確定モード選択（US-12） */}
      <Modal
        open={showModeDialog}
        onClose={() => !busy && setShowModeDialog(false)}
        title="確定方法を選んでください"
      >
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#555" }}>
          すでに{confirmedCount}件の献立があります。どうしますか？
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            fullWidth
            data-testid="gacha-mode-add-button"
            onClick={() => doConfirm("add")}
            disabled={busy}
          >
            追加する（現在{confirmedCount}件 + {results.length}件 ={" "}
            {confirmedCount + results.length}件）
          </Button>
          <Button
            fullWidth
            variant="secondary"
            data-testid="gacha-mode-replace-button"
            onClick={() => doConfirm("replace")}
            disabled={busy}
          >
            入れ替える（現在の献立を削除して{results.length}件にする）
          </Button>
        </div>
      </Modal>

      {/* 確定時のキャラ一言（gacha_decided）→ 閉じたらホームへ */}
      <CharacterBottomSheet
        trigger="gacha_decided"
        from={lastCount === 10 ? "gacha_10" : "gacha"}
        open={decidedOpen}
        onClose={() => navigate("/")}
      />
    </main>
  );
}
