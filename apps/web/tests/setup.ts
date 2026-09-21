import "@testing-library/jest-dom/vitest";

/**
 * jsdom は ResizeObserver を実装していない。
 * キャラクタードック（CharacterMascot）が自身の高さを測るために使うため、何もしない
 * スタブを入れておく（レイアウトを持たないjsdomでは測定結果自体に意味がない）。
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
