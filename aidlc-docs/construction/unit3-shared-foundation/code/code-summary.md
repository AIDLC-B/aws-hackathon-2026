# Unit 3: コード生成 概要（共有基盤）

> 生成物はワークスペースルートのReactアプリ（`src/shared/`, `src/app/providers/`）に配置。
> 設計4ステージ（Functional/NFR Req/NFR Design/Infra）はスキップし、Code Generationのみ実行。

## 生成・更新ファイル一覧

| ファイル | 区分 | 内容 |
|---|---|---|
| `src/shared/types/index.ts` | 更新 | union型（Difficulty/Rarity/Tone/Trigger/From/Source）・マスター型（DifficultyMaster/RarityMaster/GachaConfig）・キャラIF型（CharacterId/CharacterLine/CharacterDialogueQuery/UseCharacterDialogue/CharacterBottomSheetProps/CharacterInlineProps）を追記 |
| `src/shared/hooks/useCollection.ts` | 新規 | 汎用Firestoreプリミティブ（コレクション）: `useCollection<T>` 購読 + `createDoc`/`createDocWithId`/`getCollectionOnce` |
| `src/shared/hooks/useDocument.ts` | 新規 | 汎用Firestoreプリミティブ（ドキュメント）: `useDocument<T>` 購読 + `updateDocument`/`removeDocument`/`getDocumentOnce` |
| `src/shared/hooks/useMasterData.ts` | 新規 | マスターアクセサ（`getDifficultyLabel`/`getRarityLabel`・キャッシュ参照） |
| `src/app/providers/MasterDataProvider.tsx` | 新規 | 起動時1回 difficulty/rarity を order昇順で取得・Context提供（認証後に取得） |
| `src/app/providers/AppProvider.tsx` | 新規 | 横断的Provider集約（MasterDataProviderを内包） |
| `src/app/App.tsx` | 更新 | AuthProvider > AppProvider > AppRoutes に結線 |
| `src/shared/lib/functions.ts` | 新規 | Cloud Functions呼び出しヘルパー（us-central1・Emulator接続・`callFunction<TReq,TRes>`） |
| `src/shared/lib/storage.ts` | 新規 | Cloud Storage直接アクセス（圧縮アップロード/URL取得/削除・`recipe-images/{uid}/{recipeId}.jpg`） |
| `src/shared/components/ui/Button.tsx` | 新規 | UI Element（variant: primary/secondary/ghost/danger） |
| `src/shared/components/ui/Card.tsx` | 新規 | UI Element |
| `src/shared/components/ui/Modal.tsx` | 新規 | UI Element（中央モーダル・Escape/オーバーレイ閉じ） |
| `src/shared/components/ui/BottomSheet.tsx` | 新規 | UI Element（下部スライドアップ・自動クローズ対応） |
| `src/shared/components/ui/LoadingSpinner.tsx` | 新規 | UI Element |
| `src/shared/components/ui/index.ts` | 新規 | UI Elementバレル |
| `tests/unit/useCollection.test.ts` | 新規 | プリミティブ単体テスト（SDKモック） |
| `tests/unit/useDocument.test.ts` | 新規 | プリミティブ単体テスト（SDKモック） |
| `tests/unit/useMasterData.test.ts` | 新規 | マスターアクセサ単体テスト（Context） |

## 設計判断（質問回答）
- **Q1=A**: UI Elementは指定5点（Button/Card/Modal/BottomSheet/LoadingSpinner）
- **Q2=B**: 共通型はunion型・マスター型・キャラIF型に限定。Recipe/ConfirmedMenuItem等のドメインエンティティ型は各機能ユニット（5/6/7/8）で定義
- **Q3=A**: キャラクター一言は型のみ先行定義（実体はUnit 8）
- **Q4=A**: 単体テストはプリミティブ中心（Firebase SDKモック）

## CRUD 2層構造（Application Design準拠）
- **層1（本ユニット）**: `useCollection`/`useDocument` がFirestore SDK依存を集約。ジェネリック`<T>`・loading/error・購読解除を共通化
- **層2（各機能ユニット）**: `useRecipes` 等がプリミティブを内部利用し、コレクションパス・スキーマ・業務ルールを保持

## 既存資産との整合
- `src/shared/lib/firebase.ts`（Unit 1）の `app`/`db`/`storage` をそのまま利用（重複初期化なし）
- `functions` は `lib/functions.ts` で `getFunctions(app, "us-central1")` により生成
- `src/shared/types/index.ts` の `UserProfile`（Unit 1）は保持し追記のみ
- `src/app/routes.tsx`（Unit 1プレースホルダ）は本ユニットでは変更せず、各機能ユニットで差し替え予定

## マスターデータ取得とSecurity Rules
- difficultyMaster/rarityMaster は認証ユーザーのみ読み取り可（Unit 2でRules有効化）
- MasterDataProvider は `AuthContext.currentUser` を監視し、認証完了後にのみ取得（未認証時の権限エラーを回避）
- gachaConfig は読み取り不可（CF-03がAdmin SDKで参照・Unit 4）

## 拡張準拠
- **Security Baseline**: 認可ロジックは新規に持たない（RulesはUnit 1）→ N/A
- **Property-Based Testing**: 確率/抽選ロジックを含まない → 通常の単体テストのみ（N/A）

## TODO（将来・連携）
- Unit 8 完了時に CharacterBottomSheet/CharacterInline/useCharacterDialogue の実体を本IF型に対して実装
- Unit 5〜8 の各 `useXxx` フックが本プリミティブを内部利用してCRUDを実装
- テスト実行は Build & Test フェーズ（`npm run test`）でまとめて実施
