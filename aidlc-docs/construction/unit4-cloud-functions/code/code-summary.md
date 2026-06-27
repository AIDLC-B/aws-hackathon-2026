# Unit 4: Cloud Functions — コードサマリー

**生成日**: 2026-06-27
**配置**: `apps/functions/`（`firebase.json` の `functions.source=apps/functions` が参照・npm workspaces `@damesi/functions`）
**ランタイム**: Node.js 20 / firebase-functions v2 / firebase-admin / TypeScript（ESM・NodeNext）

---

## 概要

DAMESIのサーバーサイドロジック（CF-01/02/03）を実装。すべて HTTPS Callable Functions（`onCall`・リージョン `us-central1`）。フロントは `apps/web/src/shared/lib/functions.ts` の `callFunction(name, data)` から呼び出す。

| 関数 | 役割 | 対応ストーリー |
|---|---|---|
| `analyzeRecipeImage`（CF-01） | 料理画像をLLM（Vision）で認識 | US-01 |
| `suggestMeals`（CF-02） | difficulty/duration絞り込み + ランダム最大3品提案 | US-05/US-06 |
| `spinGacha`（CF-03） | gachaConfig確率でレアリティ抽選 | US-10/US-12 |

---

## ディレクトリ構成

```
apps/functions/
├── package.json              依存・スクリプト（Node 20・@damesi/functions）
├── tsconfig.json             ESM/NodeNext・strict（rootDir: ..）
├── vitest.config.ts          テスト（node環境を明示）
├── .gitignore
└── src/
    ├── index.ts              エントリポイント（3関数をexport）
    ├── types.ts              中立共有基盤 apps/shared/types からの再エクスポートバレル
    ├── analyzeRecipeImage.ts  CF-01
    ├── suggestMeals.ts        CF-02
    ├── spinGacha.ts           CF-03
    ├── lib/
    │   ├── admin.ts          Firebase Admin初期化（db共有）
    │   ├── auth.ts           requireAuth（未認証は unauthenticated）
    │   ├── gachaConfig.ts    gachaConfig取得 + メモリキャッシュ + デフォルトフォールバック
    │   ├── gachaLogic.ts     抽選の純粋ロジック（rollRarity/隣接フォールバック/drawGacha）
    │   ├── suggestLogic.ts   提案の純粋ロジック（filterCandidates/pickRandom）
    │   └── llm/
    │       ├── types.ts      LlmClientインターフェース + Visionプロンプト
    │       ├── index.ts      プロバイダファクトリ + Secret定義
    │       ├── parse.ts      LLM応答→RecipeAnalysis正規化（プロバイダ共通）
    │       ├── image.ts      画像URL→base64取得（Anthropic Vision用）
    │       ├── anthropic.ts  Anthropic Claude実装
    │       ├── openai.ts     OpenAI実装
    │       └── mock.ts       モック実装（固定レスポンス）
    └── __tests__/
        ├── parse.test.ts          (7)
        ├── gachaLogic.test.ts     (15)
        ├── suggestLogic.test.ts   (12)
        ├── gachaConfig.test.ts    (6)
        └── llmFactory.test.ts     (8)
```

テスト結果: **48件すべてpass**（`npm test`）。`npm run build`（tsc）成功・get_diagnosticsクリーン。

---

## 主要な設計判断（Q&A反映）

### Q1: 型は中立共有基盤 `apps/shared/types` に一本化（shared徹底）
当初は「functions側に独立型定義」を提案したが、ユーザー方針により**ドメイン型・CF契約型はフロント/Functions共通の単一ソースで一元管理**する。さらに配置の正しさを優先し、**フロント内部ではなく、どちらのバウンダリにも属さない中立パッケージ `apps/shared`（`@damesi/shared`）を真の単一ソース**とした。

```
apps/shared/types/index.ts          ★中立・単一ソース（FirestoreTimestamp / Recipe / CF契約型 等）
  ├── apps/web/src/shared/types      → @shared/types を再エクスポート + フロント専用UI型
  └── apps/functions/src/types.ts    → ../../shared/types を再エクスポート
```

当初の懸念は以下で解消:
1. **Timestamp非互換** → 中立側でSDK非依存の構造型 `FirestoreTimestamp`（toDate/toMillis/seconds/nanoseconds）を定義。client/admin両SDKのTimestampが構造的に代入可能で、実行時変換は不要。
2. **デプロイ境界** → functionsは `export type` で再エクスポートするのみ。型はコンパイル時に消去され、`lib/functions/src/types.js` は `export {};`（shared実体への実行時参照なし・確認済み）。

依存の向きは「フロント→バック」ではなく「両者→中立共通基盤」に統一。これによりUnit 3のQ2=B（ドメイン型は各機能ユニットで定義）を改訂し、ドメイン型を中立へ集約した。

### Q2: AIプロバイダ抽象化（拡張要件）
`LlmClient` インターフェースで実装を抽象化し、環境変数で切替:
- `LLM_PROVIDER` = `anthropic` | `openai` | `mock`（デフォルト: anthropic）
- `CLAUDE_MOCK=true` は後方互換でmock強制
- APIキー未設定時はmockへ自動フォールバック（開発利便性）
- モデルは `ANTHROPIC_MODEL` / `OPENAI_MODEL` で上書き可
- APIキーは Secret Manager（`defineSecret`: `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`）

**懸念点（明記）**:
- AnthropicとOpenAIでVision入力フォーマットが異なる（Anthropicはbase64必須のため`image.ts`でURL→base64変換、OpenAIはURL直接）。レスポンスは`parse.ts`で共通正規化。
- openai SDK追加でデプロイ依存増（コールドスタート微増）。
- プロバイダごとに別Secretが必要。

### Q3: gachaConfig取得 + キャッシュ
Firestore `gachaConfig` から取得。失敗/空時はデフォルト確率（N=0.6/R=0.25/SR=0.12/SSR=0.03）にフォールバック。一度取得したらモジュールレベルにキャッシュし、インスタンス存続中（ウォーム）は再取得しない。失敗時はキャッシュせず次回再試行。

### Q4: テストは通常の単体テストのみ（PBTなし）
ユーザー判断によりProperty-Based Testing拡張（Partial）は本ユニットでは見送り。抽選・提案のコアロジックを純粋関数に分離し、乱数注入で決定論的に検証。

### Q5: 抽選時の在庫不足は隣接レアリティへフォールバック
抽選レアリティに在庫がなければ最も近いレアリティ（距離同点は低レア優先）から補完。在庫総数がcount未満なら可能な限り充足。重複なし。

---

## セキュリティ（Security Baseline拡張・準拠）

| 項目 | 対応 |
|---|---|
| 認証検証 | 全Callable Functionで `requireAuth`（`request.auth.uid`必須・未認証は`unauthenticated`） |
| APIキー管理 | Secret Manager（`defineSecret`）。コード埋め込みなし |
| 入力バリデーション | imageUrl（非空文字列）・duration（正数）・difficulty（enum）・count（1 or 10） |
| データ分離 | Firestoreアクセスは常に `users/{uid}/...`（認証uidスコープ） |

---

## 拡張ルール準拠サマリー

| 拡張 | 状態 | 判定 |
|---|---|---|
| Security Baseline | Enabled | ✅ 準拠（認証・Secret・バリデーション・uidスコープ） |
| Property-Based Testing | Partial | ⊘ N/A（ユーザー判断Q4=Bで本ユニットは通常テストのみ・Build & Testで追加余地） |

---

## フロントエンドとの整合

| 項目 | フロント（`apps/web/src/shared/lib/functions.ts`） | Functions（本ユニット） | 一致 |
|---|---|---|---|
| 関数名 | `analyzeRecipeImage` / `suggestMeals` / `spinGacha` | 同左 | ✅ |
| リージョン | `us-central1` | `us-central1` | ✅ |
| 入出力型 | component-methods.md定義 | 中立 `apps/shared/types` を双方で参照（単一ソース） | ✅ |

---

## ローカル開発・デプロイ

```
# ビルド（ルートから・workspace委譲）
npm run build:functions
# または: npm run build --workspace @damesi/functions

# テスト
npm run test --workspace @damesi/functions

# Emulatorで起動（CLAUDE_MOCK=true でLLM呼び出しなし）
firebase emulators:start --only functions

# デプロイ（事前に Secret 設定が必要）
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only functions
```

---

## TODO / 申し送り

- ガチャ結果の保存（`gachaResults`）は将来追加予定（Application Designで保留中）。本ユニットは抽選のみで永続化しない。
- Vision認識のプロンプトはマスターデータ化していない（CF-01内に保持）。トーン調整が必要になれば外部化を検討。
- OpenAI Vision のレアリティ判定精度はAnthropicと差が出る可能性あり。プロバイダ切替時は要確認。
