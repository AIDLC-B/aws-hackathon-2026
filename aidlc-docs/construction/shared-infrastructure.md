# 共有インフラ（全ユニット共通）

> Unit 1（Firebase基盤）が定義する、全ユニットで共有するFirebaseインフラ。各ユニットはこの基盤上に構築する。

## Firebaseプロジェクト

| 項目 | 値 |
|---|---|
| プロジェクト構成 | 単一プロジェクト（dev/prod分離なし） |
| ロケーション/リージョン | `us-central1`（単一・**変更不可**） |
| 課金プラン | Blaze（従量・無料枠あり） |
| ローカル開発 | Firebase Emulator Suite |

## 共有サービス

| サービス | 用途 | 主な利用ユニット |
|---|---|---|
| Firebase Authentication（Google） | 認証・全API/Rulesの前提 | 全ユニット |
| Cloud Firestore（us-central1） | データ永続化 | U1(users), U5(recipes), U6(confirmedMenuItems), U2/U4/U8(masters) |
| Cloud Storage | 料理写真 | U5（ルールはU1所有） |
| Cloud Functions（us-central1, Blaze） | CF-01/02/03 | U4 |
| Firebase Hosting | SPA配信 | フロントエンド全体 |

## 共有設定ファイル（リポジトリ最上位）

| ファイル | 所有 | 内容 |
|---|---|---|
| `firebase.json` | U1 | Hosting/Firestore/Storage/Functions/Emulator設定 |
| `firestore.rules` | U1（骨子）+ 各ユニット追記 | Security Rules統合 |
| `storage.rules` | U1 | Cloud Storage Rules |
| `firestore.indexes.json` | U1 + 各ユニット追記 | 複合インデックス |
| `.env`（VITE_FIREBASE_*） | U1/U3 | Firebase Web設定 |

## Security Rules 統合方針

- `firestore.rules` は単一ファイルに全コレクションのルールを記述
- Unit 1が `users` ルール（フィールドレベル保護含む）を定義
- 各機能ユニットが自分のコレクション/サブコレクションのルールを追記
  - U5: `users/{uid}/recipes`
  - U6: `users/{uid}/confirmedMenuItems`
  - U2/U8: マスターコレクション（読み取り専用）
- デフォルト拒否を原則とする

## CI/CD（共有）

- GitHub Actions で lint→test（Emulator）→build→`firebase deploy`
- mainブランチへのmergeで本番デプロイ
- シークレット: GitHub Secrets（デプロイ）/ Firebase Secret Manager（Claude APIキー）

## コスト管理（共有）

- Blaze予算アラートを設定（想定外課金の早期検知）
- 単一リージョン・Firestore読み取り削減・Functions最小化で無料枠内運用を狙う
