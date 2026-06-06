# Unit 1: デプロイメントアーキテクチャ

## デプロイ構成図

```
[GitHub リポジトリ]
   │ push / merge to main
   ▼
[GitHub Actions（CI/CD）]
   ├─ Lint / 型チェック
   ├─ テスト（Vitest + Firebase Emulator: Rules/フック）
   ├─ ビルド（Vite → dist/）
   └─ firebase deploy
        ├─ Hosting（dist/）
        ├─ Firestore Rules / Indexes
        ├─ Storage Rules
        └─ Functions（functions/・Unit 4実装後）
   ▼
[Firebase プロジェクト（単一・us-central1・Blaze）]
   ├─ Authentication（Google）
   ├─ Firestore
   ├─ Cloud Storage
   ├─ Cloud Functions
   └─ Hosting（本番URL）
```

## 環境

| 環境 | 実体 | 用途 |
|---|---|---|
| local | Firebase Emulator Suite | 開発・テスト（seed投入済み） |
| production | 単一Firebaseプロジェクト | 本番（兼検証） |

> 個人開発・無料枠重視のため dev/prod のプロジェクト分離はしない（Q1=A）。検証はEmulatorで実施。

## CI/CD パイプライン（GitHub Actions）

| ステージ | 内容 |
|---|---|
| 1. セットアップ | Node.js / 依存インストール |
| 2. 静的解析 | ESLint / tsc --noEmit |
| 3. テスト | Vitest（フック・コンポーネント）+ Firebase Emulatorでのrules-unit-testing |
| 4. ビルド | `vite build`（→ dist/） |
| 5. デプロイ | `firebase deploy`（mainブランチのみ。`FIREBASE_TOKEN` or Workload Identityで認証） |

### シークレット管理
- **GitHub Secrets**: Firebaseデプロイ用トークン（`FIREBASE_TOKEN` または サービスアカウント）
- **Claude APIキー**: Firebase Secret Manager（Cloud Functions・Unit 4）。GitHubには置かない
- **Firebase Web設定**: `.env`（`VITE_FIREBASE_*`）。APIキー自体は公開前提だが、保護はSecurity Rulesで担保

## デプロイ単位と順序

> 8ユニットは同一プロジェクト・同一リポジトリにデプロイ。Unit順は実装順（基盤→共有→Functions→機能）。

| デプロイ対象 | 担当ユニット | タイミング |
|---|---|---|
| Firestore/Storage Rules・Hosting・Auth設定 | Unit 1 | 最初（基盤） |
| マスターデータ（seed） | Unit 2 | 基盤後（Admin SDKスクリプトを手動/CI実行） |
| フロントエンド（dist） | Unit 3/5/6/7/8 | 各機能実装に応じて再デプロイ |
| Cloud Functions | Unit 4 | Functions実装後 |

## ロールバック方針
- Hosting: Firebase Hostingのバージョン履歴からロールバック可能
- Rules: Gitで管理し、以前のコミットを再デプロイ
- Functions: 再デプロイで以前バージョンに戻す

## モニタリング（Q4=A）
- Firebaseコンソール標準を使用
  - Functionsログ（実行ログ・エラー）
  - 使用量ダッシュボード（Firestore読み書き・Functions呼び出し・Hosting帯域）
  - Blaze予算アラート
- 追加のCrashlytics/Performance/Analyticsは当面導入しない（必要時に検討）
