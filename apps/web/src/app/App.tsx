import { AuthProvider } from "@/app/providers/AuthProvider";
import { AppProvider } from "@/app/providers/AppProvider";
import { AppRoutes } from "@/app/routes";

/**
 * アプリのルート。Provider と Router を組み立てる。
 * - AuthProvider: 認証状態を最上位で提供
 * - AppProvider: マスターデータ等の横断的Providerを集約（認証状態に依存）
 */
export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}
