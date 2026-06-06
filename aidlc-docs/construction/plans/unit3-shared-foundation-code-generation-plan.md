# Unit 3: 共有基盤 — Code Generation 計画

> Unit 3は設計4ステージ（Functional Design / NFR Requirements / NFR Design / Infrastructure Design）をスキップし、Code Generationのみ実行。
> 理由: 純粋な技術基盤（汎用Firestoreプリミティブ・UI Element・lib・共通型・Provider）であり、新規業務ロジック・新規NFR・新規インフラを伴わない。型・スキーマ・責務はApplication Designで確定済み。

## ユニットコンテキスト
- **対象**: Unit 3（共有基盤）
- **配置**: `src/shared/`, `src/app/providers/`（ワークスペースルートのReactアプリ）
- **依存**: Unit 1（`shared/lib/firebase.ts` 初期化済み・`shared/types/index.ts` にUserProfile定義済み）、Unit 2（マスターデータ投入済み: difficultyMaster / rarityMaster）
- **利用元**: Unit 5/6/7/8（プリミティブ・型・UI・キャラIF型をimport）

## ステージ要否評価（拡張準拠サマリー）
| ステージ | 判定 | 理由 |
|---|---|---|
| Functional Design | SKIP | 新規データモデル・複雑業務ロジックなし（型はApplication Designで確定） |
| NFR Requirements | SKIP | 新規NFRなし（Security RulesはUnit 1所有） |
| NFR Design | SKIP | NFR Requirements未実行のため連動スキップ |
| Infrastructure Design | SKIP | 共有インフラはUnit 1で定義済み（shared-infrastructure.md） |
| Code Generation | EXECUTE | 常に実行 |

- **Security Baseline拡張**: 本ユニットは認証/認可ロジックを新規に持たない（Security RulesはUnit 1）。プリミティブは `request.auth` 前提のパスを扱うのみ → 該当箇所なし（N/A）。
- **Property-Based Testing拡張（Partial）**: 抽選等の確率ロジックは含まないため本ユニットでは通常の単体テストのみ（PBT対象なし・N/A）。

## 既存資産（Unit 1生成済み・重複回避）
- `src/shared/lib/firebase.ts`（app/auth/db/storage/googleProvider・Emulator接続）→ そのまま利用
- `src/shared/types/index.ts`（UserProfile / NewUserProfileInput）→ **拡張**（追記）
- `src/app/App.tsx`（AuthProviderのみ）→ MasterDataProvider/AppProviderを組み込み
- `src/app/routes.tsx`（プレースホルダ）→ 本ユニットでは変更しない（各機能ユニットで差し替え）

## スタイリング方針
- Unit 1は外部CSSフレームワーク不使用・インラインstyle中心。**同方針を踏襲**（UI Elementはインラインstyle + 最小限のpropベース）。追加の依存は導入しない。

---

## 質問

### Question 1: UI Element の初期セット範囲

`shared/components/ui/` に用意するUI Elementの範囲は？（components.md指定: Button, Card, Modal, BottomSheet, LoadingSpinner）

A) **指定の5点を実装**（Button / Card / Modal / BottomSheet / LoadingSpinner・推奨）
B) 5点 + よく使う追加（例: Input, Spinner以外のSkeleton等）も先行実装
C) 最小限（Button / LoadingSpinner のみ・他は利用ユニットで都度追加）
D) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 2: 共通型の定義範囲

`shared/types/index.ts` に今回定義する型の範囲は？

A) **全ドメイン共通型を一括定義**（Recipe / RecipeInput / ConfirmedMenuItem / CharacterDialogue / DifficultyMaster / RarityMaster / GachaConfig / union型[Difficulty/Rarity/Tone/Trigger/From/Source] / キャラIF型[CharacterDialogueQuery, CharacterBottomSheetProps]・推奨）
B) Unit 3が直接使う型のみ（マスター型・union型）に絞り、ドメイン型は各機能ユニットで定義
C) Other (please describe after [Answer]: tag below)

[Answer]:B

### Question 3: キャラクター一言の先行インターフェース

Unit 5/6/7がプレースホルダで利用するためのキャラIF（`useCharacterDialogue`型・`CharacterBottomSheet`/`CharacterInline` props）の扱いは？

A) **型定義（interface/props）のみ先行定義**し、実体はUnit 8（推奨・unit-of-work-dependency.mdの方針）
B) 型 + 最小スタブ実装（固定文言を返すダミー）も用意し、Unit 8で差し替え
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 4: 単体テストの範囲

本ユニットで生成する単体テストは？（実行はBuild & Testフェーズ）

A) **プリミティブ中心**（useCollection / useDocument / useMasterData のロジックをFirebase SDKモックで検証・推奨）
B) プリミティブ + UI Element のレンダリングテストも含む
C) テストは今回生成せず Build & Test フェーズでまとめて
D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## 実行ステップ（回答確定後に生成）

- [x] Step 1: 共通型の拡張（`src/shared/types/index.ts` に union型 / マスター型 / キャラIF型を追記。Q2=Bによりドメインエンティティ型は各機能ユニットで定義）
- [x] Step 2: 汎用Firestoreプリミティブ生成
  - `src/shared/hooks/useCollection.ts`（onSnapshot購読・createDoc/createDocWithId/getCollectionOnce・loading/error/unsubscribe）
  - `src/shared/hooks/useDocument.ts`（onSnapshot購読・updateDocument/removeDocument/getDocumentOnce）
- [x] Step 3: マスターデータアクセサ + Provider
  - `src/app/providers/MasterDataProvider.tsx`（起動時1回 getCollectionOnce でdifficulty/rarity取得・Context提供・認証後に取得）
  - `src/shared/hooks/useMasterData.ts`（Context参照・getDifficultyLabel/getRarityLabel）
- [x] Step 4: lib ヘルパー生成
  - `src/shared/lib/functions.ts`（callFunction呼び出しヘルパー・us-central1・Emulator接続）
  - `src/shared/lib/storage.ts`（圧縮アップロード・ダウンロードURL取得・削除）
- [x] Step 5: UI Element 生成（`src/shared/components/ui/`：Button / Card / Modal / BottomSheet / LoadingSpinner + index barrel）
- [x] Step 6: キャラクターIF（型のみ先行・Q3=A・shared/typesに定義）
- [x] Step 7: Provider結線（`src/app/App.tsx` に AppProvider/MasterDataProvider を組み込み、`src/app/providers/AppProvider.tsx` 生成）
- [x] Step 8: 単体テスト生成（Q4=A・useCollection/useDocument/useMasterData）
- [x] Step 9: ドキュメント生成（`aidlc-docs/construction/unit3-shared-foundation/code/code-summary.md`）
- [x] Step 10: 整合性確認（get_diagnostics 全ファイルクリーン・import alias `@/` 一貫・既存Unit 1資産と非重複）

---

*質問に回答したら「回答しました」とお知らせください。回答に基づきステップを確定し、生成します。*
