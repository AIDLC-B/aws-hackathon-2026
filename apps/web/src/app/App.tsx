import { AuthProvider } from "@/app/providers/AuthProvider";
import { AppProvider } from "@/app/providers/AppProvider";
import { AppRoutes } from "@/app/routes";

/**
 * アプリのルート。Provider と Router を組み立てる。
 * - AuthProvider: 認証状態を最上位で提供
 * - AppProvider: マスターデータ等の横断的Providerを集約（認証状態に依存）
 *
 * `damesi-shell` はモバイル前提のUIをPCでも破綻させないための中央寄せシェル
 * （最大480px・styles/global.css）。
 */
export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="damesi-shell">
          <AppRoutes />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
