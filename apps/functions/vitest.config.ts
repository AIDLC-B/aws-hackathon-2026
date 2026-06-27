import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Cloud Functions はNode環境で動作するため node を明示
    // （ルート設定の jsdom を継承しないようにする）
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
