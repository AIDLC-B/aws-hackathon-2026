# DAMESI（ダメシ）

献立を、考えない。主婦・主夫の献立思考を肩代わりするアプリ。

## 技術スタック
- フロントエンド: React + TypeScript + Vite
- バックエンド: Firebase（Authentication[Google] / Firestore / Cloud Storage / Cloud Functions / Hosting）
- AI: Anthropic Claude API（Cloud Functions経由・Unit 4で実装）

## 必要環境
- Node.js 20+
- Firebase CLI（`npm install -g firebase-tools`）
- Firebaseプロジェクト（リージョン: `us-central1` / Blazeプラン）

## セットアップ
1. 依存インストール
   ```
   npm install
   ```
2. 環境変数設定: `.env.example` を `.env` にコピーし、Firebaseコンソールの設定値を記入
3. Google認証を有効化（Firebaseコンソール > Authentication > Sign-in method > Google）

## ローカル開発（Firebase Emulator）
```
# Emulator起動（別ターミナル）
npm run emulators

# .env で VITE_USE_EMULATOR=true にして開発サーバー起動
npm run dev
```

## テスト
```
npm run test          # 単体・コンポーネントテスト
npm run test:rules    # Security Rules テスト（Firestore Emulator必要）
```
> Rulesテストは Emulator 起動中、または `firebase emulators:exec --only firestore "npm run test:rules"` で実行。

## ビルド & デプロイ
```
npm run build
npm run deploy        # firebase deploy（手動）
```
CI/CDは GitHub Actions（`.github/workflows/deploy.yml`）。mainブランチへのmergeで自動デプロイ。

## ディレクトリ構成（モノレポ・npm workspaces）
```
package.json          ルート（workspaces: apps/*・各種スクリプトを委譲）
apps/
├── shared/           @damesi/shared    フロント/Functions共通の型（単一ソース）
├── web/              @damesi/web        React アプリ（src: app / features / shared, tests）
├── functions/        @damesi/functions  Cloud Functions（Unit 4）
└── seed/             @damesi/seed       マスターデータ投入・インストールガイド（Unit 2）
firestore.rules / storage.rules / firestore.indexes.json / firebase.json
.env / .env.example   環境変数（リポジトリ直下に集約・Viteは envDir でルート参照）
```

> 型の単一ソースは `apps/shared/types`。`apps/web`（`@shared/*` エイリアス）と `apps/functions`（相対 `import type`）が参照する。型は実行時に消去されるため依存パッケージ化は不要。

## 実装状況
- [x] Unit 1: Firebase基盤 & 認証（Google認証・Security Rules）
- [x] Unit 2: セットアップ／マスターデータ
- [x] Unit 3: 共有基盤
- [x] Unit 4: Cloud Functions（CF-01/02/03・LLMプロバイダ抽象化）
- [x] Unit 5: 料理管理（登録/一覧/詳細/編集・オンボーディング・キャラ一言スタブ）
- [ ] Unit 6: 献立提案
- [ ] Unit 7: 献立ガチャ
- [ ] Unit 8: AIキャラクター
