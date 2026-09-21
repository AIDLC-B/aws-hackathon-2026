import { useEffect, useMemo, useRef, useState } from "react";
import type { CharacterMascotProps } from "@/shared/types";
import { useCharacterDialogue } from "@/features/character/hooks/useCharacterDialogue";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { pickRandomVariant } from "@/features/character/characterImages";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";

/** ドラッグ位置・非表示状態の保存先（タブを閉じたらリセット） */
const POSITION_KEY = "damesi.mascot.position";
const HIDDEN_KEY = "damesi.mascot.hidden";

/** タップとドラッグの判定しきい値（px） */
const DRAG_THRESHOLD = 5;

interface Position {
  left: number;
  top: number;
}

/** sessionStorage は private モード等で例外を投げうるため、失敗は無視する */
function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できなくても表示自体は続行する
  }
}

/**
 * 常駐マスコット表示（Unit 8 / 表示リファイン）。
 *
 * 画面隅に立ち絵を浮かべ、その上に尻尾付きの吹き出しを出して「しゃべっている」見た目にする。
 * 旧 `CharacterInline`（画面内に差し込む横帯）の置き換え。
 *
 * ## 邪魔になったときの逃がし方
 * オーバーレイである以上コンテンツの上に乗るため、ユーザーが自分でどかせるようにしている:
 * - **ドラッグで移動**: 立ち絵をつかんで好きな位置へ。位置は sessionStorage に保存し、
 *   画面遷移しても維持される（タブを閉じるとリセット）
 * - **✕ で一時的に非表示**: 消すと小さな丸ボタン（💬）だけが残り、押せば戻る。
 *   非表示もセッション中は維持される
 * - **立ち絵タップで吹き出しだけ格納**（もう一度タップで再表示）
 *
 * 表情は台詞1件につき一度だけランダムに選ぶ（`pickRandomVariant`）。同じ台詞でも
 * 絵が変わるが、表示中に差し替わることはない。
 */
export function CharacterMascot({
  trigger,
  from,
  bottomOffset = 72,
  size = 140,
  autoCollapseMs = 0,
}: CharacterMascotProps) {
  const { getDialogue, loading } = useCharacterDialogue();

  /**
   * 台詞の抽選はランダムなので、レンダーのたびに呼ぶとキャラが入れ替わってしまう
   * （ドラッグ開始・吹き出しの開閉など、この画面の状態更新すべてが引き金になる）。
   * trigger / from とマスターの読み込み完了でのみ引き直す。
   */
  const line = useMemo(
    () => getDialogue({ trigger, from }),
    // getDialogue は毎レンダー新しい関数になるため依存に含めない（含めると毎回再抽選になる）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger, from, loading],
  );

  const [expanded, setExpanded] = useState(true);
  const [hidden, setHidden] = useState(() => readSession<boolean>(HIDDEN_KEY) === true);
  const [position, setPosition] = useState<Position | null>(() =>
    readSession<Position>(POSITION_KEY),
  );
  const [dragging, setDragging] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  /** ドラッグ開始時のポインタ位置と要素左上のズレ。タップ判定にも使う */
  const dragState = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  /** 保存用の最新座標（state の反映待ちに依存しない） */
  const latestPosition = useRef<Position | null>(position);

  const characterId = line?.characterId;
  const message = line?.message;

  // 台詞が変わったときだけ表情を選び直す（表示中の差し替わりを防ぐ）
  const variant = useMemo(
    () => (characterId ? pickRandomVariant(characterId) : 0),
    // message も依存に含め、同じキャラの台詞が切り替わったら表情も選び直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterId, message],
  );

  // 台詞が変わったら吹き出しを開き直す
  useEffect(() => {
    setExpanded(true);
  }, [characterId, message]);

  // autoCollapseMs 指定時のみ、一定時間で吹き出しだけ格納（立ち絵は残す）
  useEffect(() => {
    if (!expanded || !autoCollapseMs) return;
    const timer = window.setTimeout(() => setExpanded(false), autoCollapseMs);
    return () => window.clearTimeout(timer);
  }, [expanded, autoCollapseMs, characterId, message]);

  function handlePointerDown(e: React.PointerEvent<HTMLElement>) {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
    };
    // jsdom など未実装の環境があるため存在チェックしてから使う
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const state = dragState.current;
    const el = rootRef.current;
    if (!state || !el) return;

    const rect = el.getBoundingClientRect();
    const left = e.clientX - state.dx;
    const top = e.clientY - state.dy;
    if (
      !state.moved &&
      Math.hypot(left - rect.left, top - rect.top) < DRAG_THRESHOLD
    ) {
      return; // まだタップの範囲内
    }
    state.moved = true;

    // 画面外へ出しきらないように収める
    const clamped: Position = {
      left: Math.min(Math.max(0, left), window.innerWidth - rect.width),
      top: Math.min(Math.max(0, top), window.innerHeight - rect.height),
    };
    latestPosition.current = clamped;
    setPosition(clamped);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLElement>) {
    const state = dragState.current;
    dragState.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!state) return;
    if (state.moved) {
      if (latestPosition.current) writeSession(POSITION_KEY, latestPosition.current);
    } else {
      // 動いていなければタップ = 吹き出しの開閉
      setExpanded((v) => !v);
    }
  }

  function handleHide() {
    setHidden(true);
    writeSession(HIDDEN_KEY, true);
  }

  function handleShow() {
    setHidden(false);
    writeSession(HIDDEN_KEY, false);
    setExpanded(true);
  }

  if (!line || !characterId) return null;
  const profile = getCharacterProfile(characterId);

  /** 既定位置はシェル右下。ドラッグ後は保存した座標に従う */
  const anchorStyle: React.CSSProperties = position
    ? { left: position.left, top: position.top }
    : {
        right: `max(12px, calc(50% - var(--damesi-shell-width) / 2 + 12px))`,
        bottom: bottomOffset,
      };

  if (hidden) {
    return (
      <button
        type="button"
        data-testid="character-mascot-show-button"
        aria-label={`${profile.name}を表示する`}
        onClick={handleShow}
        style={{
          position: "fixed",
          ...anchorStyle,
          zIndex: 800,
          padding: 0,
          border: "none",
          background: "transparent",
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
          cursor: "pointer",
          lineHeight: 0,
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          {/* 隠していても誰が待っているか分かるよう、顔を見せる円アイコンにする */}
          <CharacterAvatar
            characterId={characterId}
            shape="circle"
            size={52}
            variant={variant}
            crop="face"
            bordered
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              border: `1.5px solid ${profile.themeColor}`,
              fontSize: 10,
              lineHeight: "17px",
              textAlign: "center",
            }}
          >
            💬
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      data-testid="character-mascot"
      ref={rootRef}
      style={{
        position: "fixed",
        ...anchorStyle,
        zIndex: 800,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        maxWidth: "min(320px, calc(100vw - 24px))",
        pointerEvents: "none",
        touchAction: "none",
      }}
    >
      {expanded && (
        <div
          data-testid="character-mascot-bubble"
          role="status"
          style={{
            position: "relative",
            background: "#fff",
            border: `2px solid ${profile.themeColor}`,
            borderRadius: 16,
            padding: "10px 30px 10px 14px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
            pointerEvents: "auto",
            animation: "damesi-mascot-pop 0.28s cubic-bezier(.2,1.5,.4,1)",
            transformOrigin: "bottom right",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: profile.themeColor,
              marginBottom: 2,
            }}
          >
            {profile.name}
          </span>
          <span style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
            {line.message}
          </span>

          {/* 一時的に消す（小さな丸ボタンで戻せる） */}
          <button
            type="button"
            data-testid="character-mascot-hide-button"
            aria-label={`${profile.name}を一時的に隠す`}
            onClick={handleHide}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "#bbb",
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {/* 吹き出しの尻尾（立ち絵側を指す） */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              bottom: -8,
              right: 28,
              width: 14,
              height: 14,
              background: "#fff",
              borderRight: `2px solid ${profile.themeColor}`,
              borderBottom: `2px solid ${profile.themeColor}`,
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}

      {/* 立ち絵: つかんで移動、動かさずに離せば吹き出しの開閉 */}
      <div
        data-testid="character-mascot-portrait"
        role="button"
        tabIndex={0}
        aria-label={`${profile.name}（ドラッグで移動・タップで一言の表示切替）`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        style={{
          pointerEvents: "auto",
          cursor: dragging ? "grabbing" : "grab",
          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18))",
          animation: position ? undefined : "damesi-mascot-bounce 0.5s ease-out",
          userSelect: "none",
        }}
      >
        <CharacterAvatar
          characterId={characterId}
          shape="portrait"
          size={size}
          variant={variant}
        />
      </div>

      <style>{`
        @keyframes damesi-mascot-pop {
          from { opacity: 0; transform: scale(0.7) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes damesi-mascot-bounce {
          0%   { transform: translateY(40%) scale(0.9); opacity: 0; }
          60%  { transform: translateY(-8%) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
