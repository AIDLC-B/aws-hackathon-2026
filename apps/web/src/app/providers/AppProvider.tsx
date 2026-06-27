import type { ReactNode } from "react";
import { MasterDataProvider } from "@/app/providers/MasterDataProvider";

/**
 * アプリ全体の横断的Providerを組み立てる集約Provider。
 *
 * 現状は MasterDataProvider を内包する。将来のグローバル状態（トースト通知・
 * テーマ等）の追加はここに集約し、App.tsx 側のネストを浅く保つ。
 * AuthProvider は認証状態を最上位で提供するため App.tsx 直下に置き、本Providerは
 * その内側で利用する（MasterDataProvider が認証状態に依存するため）。
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return <MasterDataProvider>{children}</MasterDataProvider>;
}
