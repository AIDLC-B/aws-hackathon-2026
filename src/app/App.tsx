import { AuthProvider } from "@/app/providers/AuthProvider";
import { AppRoutes } from "@/app/routes";

/**
 * アプリのルート。Provider と Router を組み立てる。
 * MasterDataProvider / AppProvider は Unit 3 で追加予定。
 */
export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
