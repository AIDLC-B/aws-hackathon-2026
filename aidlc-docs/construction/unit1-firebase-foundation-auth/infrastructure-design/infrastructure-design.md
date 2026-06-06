# Unit 1: インフラ設計

> Unit 1はFirebase基盤を所有し、全ユニット共有のインフラを定義する。

## 確定パラメータ

| 項目 | 値 |
|---|---|
| 環境構成 | 単一Firebaseプロジェクト + ローカルEmulator |
| ロケーション/リージョン | `us-central1`（単一リージョン・後から変更不可） |
| 課金プラン | Blaze（従量・無料枠あり）※Cloud Functionsの外部API呼び出しに必須 |
| デプロイ | GitHub Actions（CI/CD） |
| モニタリング | Firebaseコンソール標準 |

## 論理コンポーネント → Firebaseサービス マッピング

| 論理コンポーネント（NFR Design） | Firebaseサービス | 設定 |
|---|---|---|
| 認証（Google OAuth） | Firebase Authentication | Google Provider有効化・承認済みドメイン設定 |
| usersデータ | Cloud Firestore（us-central1） | ネイティブモード |
| Firestore Security Rules | Firestore Rules | `firestore.rules` |
| Cloud Storage Security Rules | Storage Rules | `storage.rules`（料理写真・Unit 5利用） |
| SPA配信 | Firebase Hosting | SPAリライト（`/** → /index.html`）・HTTPS |
| Cloud Functions（Unit 4） | Cloud Functions（us-central1） | Blazeプラン必須・Secret ManagerでClaude APIキー |

## Firebase Authentication 設定

- **プロバイダ**: Google を有効化
- **承認済みドメイン**: localhost（Emulator）+ Hostingのドメイン（`*.web.app` / `*.firebaseapp.com` + カスタムドメインがあれば追加）
- **セッション永続化**: `browserLocalPersistence`（クライアント側設定）

## Firestore 設定

- **ロケーション**: `us-central1`
- **モード**: ネイティブモード
- **インデックス**: `firestore.indexes.json`（複合インデックスは各ユニットのクエリ確定時に追加。Unit 1のusersは単一ドキュメントアクセスのため不要）
- **Security Rules**: `firestore.rules`（Unit 1がusersルールを定義、他ユニットが追記し統合）

## Cloud Storage 設定

- **バケット**: デフォルトバケット
- **Security Rules**: `storage.rules`（`recipe-images/{uid}/` 本人限定・5MB・image/*）
- **利用**: Unit 5（料理写真）。ルール定義はUnit 1所有

## firebase.json（構成概要）

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": { "rules": "storage.rules" },
  "functions": { "source": "functions" },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage": { "port": 9199 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true }
  }
}
```

## コスト最適化（無料枠運用）

| 施策 | 内容 |
|---|---|
| 予算アラート | Blazeプランでも予算アラート（例: 月¥0超で通知）を設定し想定外課金を防止 |
| 単一リージョン | `us-central1` 単一リージョンでマルチリージョン費用を回避 |
| Firestore読み取り削減 | マスターのセッションキャッシュ・非正規化（Application Design方針）で読み取り抑制 |
| Functions最小化 | Cloud FunctionsはCF-01/02/03のみ。CRUDは直接アクセス |
