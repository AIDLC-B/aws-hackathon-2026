# AI-DLC State Tracking

## Project Information
- **Project Name**: DAMESI（ダメシ）
- **Project Type**: Greenfield
- **Start Date**: 2026-05-03T00:00:00Z
- **Last Updated**: 2026-07-26T02:00:00Z
- **Current Stage**: CONSTRUCTION PHASE - 全8ユニット完了 → Build and Test 着手前

## リポジトリ構成（2026-06-27 monorepo化）
- **形態**: npm workspaces（`workspaces: ["apps/*"]`）
- **apps/shared**: `@damesi/shared` フロント/Functions共通の型（単一ソース・型のみ）
- **apps/web**: `@damesi/web` Reactアプリ（旧 src/ + index.html/vite/tsconfig/tests）
- **apps/functions**: `@damesi/functions` Cloud Functions（旧 functions/）
- **apps/seed**: `@damesi/seed` マスターデータ投入（旧 setup/）
- **firebase.json**: hosting.public=apps/web/dist, functions.source=apps/functions
- **ビルド/テスト**: ルートの委譲スクリプト（`npm run build/typecheck/test/lint`）

## Workspace State
- **Existing Code**: No
- **Reverse Engineering Needed**: No
- **Workspace Root**: /

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes | Requirements Analysis |
| Property-Based Testing | Partial | Requirements Analysis |

## Architecture Change
- **Previous**: AWS（Lambda + API Gateway + DynamoDB + S3 + Cognito + Bedrock）
- **Current**: Firebase（Authentication + Firestore + Cloud Storage + Cloud Functions + Hosting）+ Anthropic Claude API
- **Reason**: 金銭的コスト最小化（Firebase無料枠内運用）

## Stage Progress

### 🔵 INCEPTION PHASE
- [x] Workspace Detection - COMPLETED (2026-05-23T00:00:00Z)
- [ ] Reverse Engineering - SKIPPED（Greenfield）
- [x] Requirements Analysis - COMPLETED & APPROVED (2026-05-23T00:03:00Z)
- [ ] User Stories - SKIPPED（既存成果物活用）
- [ ] Workflow Planning - COMPLETED & APPROVED (2026-05-23T00:04:00Z)
- [x] Application Design - COMPLETED & APPROVED (2026-06-06T00:30:00Z)
- [x] Units Generation - COMPLETED & APPROVED (2026-06-06T00:50:00Z)

### 🟢 CONSTRUCTION PHASE
**Per-Unit Loop（8ユニット・実装順）**: U1 基盤&認証 → U2 セットアップ/マスター → U3 共有基盤 → U4 Cloud Functions → U5 料理管理 → U6 献立提案 → U7 ガチャ → U8 AIキャラクター

#### Unit 1: Firebase基盤 & 認証 ✅ 完了
- [x] Functional Design - COMPLETED & APPROVED (2026-06-06T01:15:00Z)
- [x] NFR Requirements - COMPLETED & APPROVED (2026-06-06T01:35:00Z)
- [x] NFR Design - COMPLETED & APPROVED (2026-06-06T01:50:00Z)
- [x] Infrastructure Design - COMPLETED & APPROVED (2026-06-06T02:10:00Z)
- [x] Code Generation - COMPLETED & APPROVED (2026-06-06T02:40:00Z)

#### Unit 2: セットアップ／マスターデータ ✅ 完了
- [-] Functional Design - SKIPPED（スキーマ定義済み・複雑な業務ロジックなし）
- [-] NFR Requirements - SKIPPED（新規NFRなし）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（共有基盤利用）
- [x] Code Generation - COMPLETED & APPROVED (2026-06-06T03:15:00Z)

#### Unit 3: 共有基盤 ✅ 完了
- [-] Functional Design - SKIPPED（新規データモデル・複雑業務ロジックなし）
- [-] NFR Requirements - SKIPPED（新規NFRなし・RulesはUnit 1所有）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（共有インフラはUnit 1で定義済み）
- [x] Code Generation - COMPLETED & APPROVED (2026-06-27T00:00:00Z)

#### Unit 4: Cloud Functions基盤 ✅ 完了
- [-] Functional Design - SKIPPED（CF入出力・処理フローはApplication Designで確定済み）
- [-] NFR Requirements - SKIPPED（新規NFRなし・Firebase/Claude APIのNFRはUnit 1で定義）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（FirebaseインフラはUnit 1で定義済み）
- [x] Code Generation - COMPLETED & APPROVED (2026-06-27T02:10:00Z / CF-01/02/03 + LLM抽象化 + テスト48件pass + monorepo化)

#### Unit 5: 料理管理 ✅ 完了
- [-] Functional Design - SKIPPED（型・スキーマ・業務ルール確定済み）
- [-] NFR Requirements - SKIPPED（新規NFRなし）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（Storage/CF/Firestore定義済み）
- [x] Code Generation - COMPLETED & APPROVED (2026-06-27T02:50:00Z / features/recipe・onboarding・character[スタブ]・ボトムナビ・web全50テストpass)

#### Unit 6: 献立提案 ✅ 完了
- [-] Functional Design - SKIPPED（提案/確定フロー・CF-02は確定済み）
- [-] NFR Requirements - SKIPPED（新規NFRなし）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（Firestore/CF定義済み）
- [x] Code Generation - COMPLETED & APPROVED（2026-06-27T03:40:00Z / features/suggestion・features/confirmedMenu・CharacterInlineスタブ・ホームディスパッチ・ガチャ誘導プレースホルダ・ConfirmedMenuItemスナップショット化・web新規4テスト含む64 pass）

#### Unit 7: ガチャ ✅ 完了
- [-] Functional Design - SKIPPED（抽選CF-03・確率gachaConfigはUnit 4で確定）
- [-] NFR Requirements - SKIPPED（新規NFRなし）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（Firestore/CF定義済み）
- [x] Code Generation - COMPLETED & APPROVED（2026-06-27T04:20:00Z / features/gacha[useGacha・GachaSpinner・GachaResult・RerollLimitScreen・GachaPage]・useConfirmedMenu.clearAll追加・/gacha実体化・リセマラsessionStorage・10連add/replace・web新規4テスト含む83 pass）

#### Unit 8: AIキャラクター ✅ 完了
- [-] Functional Design - SKIPPED（キャラIF型・台詞スキーマ・trigger×tone対応表が確定済み）
- [-] NFR Requirements - SKIPPED（新規NFRなし）
- [-] NFR Design - SKIPPED（連動）
- [-] Infrastructure Design - SKIPPED（Firestore/Hosting定義済み）
- [x] Code Generation Part 1（計画）- COMPLETED（Q1〜Q6 回答確定）
- [x] Code Generation Part 2（生成）- COMPLETED & APPROVED（2026-07-26T02:00:00Z / コミット `8c0d15f`「基本機能作成」でmainへpush済み / features/character[characterProfiles・characterImages(画像31枚結線)・dialogueSelector・CharacterAvatar・useCharacterDialogue正式実装・BottomSheet/Inline立ち絵化]・CharacterDialogueProvider・features/settings[useSettings・PremiumSettings・SettingsPage・CharacterSelectPage]・/settings + /settings/characters 結線・firestore.rules サブコレクション補完・web新規5テスト含む102 pass）

- [ ] Build and Test - EXECUTE（全ユニット完了後）

### 🟡 OPERATIONS PHASE
- [ ] Operations - PLACEHOLDER

## ローカル開発環境（2026-07-26 確立）
- **Firebaseプロジェクト**: `da-mesi`（`.firebaserc` の default に固定・Emulatorも同IDで起動）
- **前提ツール**: Firebase CLI（brew）/ Node v20+ / **JDK 21以上**（firebase-toolsが21未満を拒否）
- **`.env`（ローカル）**: `VITE_USE_EMULATOR=true` / `VITE_FIREBASE_PROJECT_ID=da-mesi`（**Emulator起動プロジェクトと一致必須**・不一致だとCallable Functionsが404→CORSエラー）/ APIキーはダミー / `LLM_PROVIDER=mock`（CF-01の画像認識を固定レスポンス化しAPIキー不要）
- **起動順**: `npm run build:functions` → `firebase emulators:start` → `FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=da-mesi npm run seed`（apps/seed）→ `npm run dev`
- **詳細手順・トラブルシューティング**: `apps/seed/SETUP.md` セクション8に記載
- **本番切り戻し**: `.env` を実プロジェクト値へ / `VITE_USE_EMULATOR=false` / `LLM_PROVIDER=anthropic`

## 次回セッションの再開ポイント
- **再開アクション**: Build and Test ステージ（全8ユニット完了後の最終ステージ）を実行
- **参照ファイル**: `aidlc-docs/construction/unit8-ai-character/code/code-summary.md`（Unit 8生成内容・申し送り）, `apps/web/src/features/character`, `apps/web/src/features/settings`, `firestore.rules`（Unit 8でサブコレクション補完済み・エミュレータでのRules検証はBuild & Testで実施）
- **Build & Test での既知課題**: `apps/web/tests/rules/firestore.rules.test.ts` はエミュレータ前提で未実行。`shared/hooks/useCollection.ts:72` のlint指摘（`react-hooks/exhaustive-deps` ルール未定義）も未解消。キャラクター画像（計約7MB）のWebP最適化は任意改善
