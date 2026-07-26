# DAMESI セットアップガイド

Firebaseプロジェクトの作成からマスターデータ投入までの手順。

## 1. Firebaseプロジェクト作成
1. [Firebaseコンソール](https://console.firebase.google.com/) で新規プロジェクト作成
2. **ロケーション**: `us-central1`（**後から変更不可**）
3. **料金プラン**: Blaze（従量・無料枠あり。Cloud Functionsの外部API呼び出しに必須）
4. 予算アラートを設定（想定外課金の早期検知）

## 2. 各サービスの有効化
- **Authentication**: Sign-in method > Google を有効化
- **Firestore Database**: ネイティブモードで作成（ロケーション `us-central1`）
- **Storage**: デフォルトバケットを作成
- **Hosting**: 後で `firebase init hosting` / `firebase deploy`

## 3. Webアプリ登録と環境変数
1. プロジェクト設定 > マイアプリ > Webアプリを追加
2. 表示される設定値を、リポジトリルートの `.env`（`.env.example` をコピー）に記入
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

## 4. Security Rules のデプロイ
```
firebase deploy --only firestore:rules,storage
```

## 5. マスターデータ投入（seed）

### 前提
- サービスアカウントキー（Admin SDK用）を用意
  - Firebaseコンソール > プロジェクト設定 > サービスアカウント > 新しい秘密鍵を生成
  - **このJSONは絶対にリポジトリにコミットしない**

### Emulatorへ投入（ローカル開発）
```
# 別ターミナルでEmulator起動
firebase emulators:start --only firestore

# seed実行（Emulator対象）※ルートで npm install 済みなら個別インストール不要
cd apps/seed
FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=<project-id> npm run seed
```
> ルートから `npm run seed --workspace @damesi/seed` でも実行可能。

### 本番へ投入
```
cd apps/seed
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json npm run seed
```

> `FIRESTORE_EMULATOR_HOST` が設定されていればEmulator、未設定かつ `GOOGLE_APPLICATION_CREDENTIALS` があれば本番へ投入されます。

## 6. 投入されるマスターデータ
| コレクション | 件数の目安 | 内容 |
|---|---|---|
| `difficultyMaster` | 3 | easy/normal/hard |
| `rarityMaster` | 4 | N/R/SR/SSR |
| `gachaConfig` | 4 | レアリティ別確率 |
| `characterDialogues` | 多数 | 7キャラ × トリガー × トーンのセリフ（無料+プレミアム） |

## 7. 動作確認
```
# リポジトリルートで
npm install
npm run dev   # .env で VITE_USE_EMULATOR=true ならEmulator接続
```

---

## 8. ローカル（Emulator）で動かす手順と注意点

Firebaseプロジェクトの実APIキーが無くても、Emulator だけでアプリ全体を動かせる。

### 前提ツール
| ツール | 要件 | 備考 |
|---|---|---|
| Firebase CLI | `brew install firebase-cli` | |
| Node.js | v20 以上 | Functions の engines は 20 |
| **JDK** | **21 以上** | firebase-tools は JDK 21 未満を拒否する（Firestore/Storage Emulator が JVM 上で動く）。`brew install openjdk@21` 後に `JAVA_HOME=/opt/homebrew/opt/openjdk@21` と `PATH` を設定 |

### 起動手順
```
# 0. Functions をビルド（Emulator はビルド済み lib/ を読む）
npm run build:functions

# 1. Emulator 起動（.firebaserc の default プロジェクトで起動）
firebase emulators:start

# 2. マスターデータ投入（別ターミナル）
cd apps/seed
FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=da-mesi npm run seed

# 3. 開発サーバー（別ターミナル）
npm run dev
```

### ローカル用 `.env` の設定
| 変数 | ローカル値 | 理由 |
|---|---|---|
| `VITE_USE_EMULATOR` | `true` | Auth/Firestore/Functions/Storage を Emulator に接続（`shared/lib/firebase.ts` / `functions.ts`） |
| `VITE_FIREBASE_API_KEY` | ダミー可 | Emulator はAPIキー検証を行わない |
| `VITE_FIREBASE_PROJECT_ID` | **Emulator の起動プロジェクトと同一値** | Callable Functions のURLが `http://localhost:5001/{projectId}/{region}/{関数名}` になるため、不一致だと **404 → CORSエラー** になる |
| `LLM_PROVIDER` | `mock` | CF-01の画像認識が固定レスポンスになり、Anthropic/OpenAI のAPIキーが不要 |

### よくあるエラーと対処
| 症状 | 原因 | 対処 |
|---|---|---|
| `API key not valid`（identitytoolkit） | `VITE_USE_EMULATOR=false` のまま、または `.env` がプレースホルダ | `VITE_USE_EMULATOR=true` にして dev サーバーを再起動（Viteは起動時のみ `.env` を読む） |
| `firebase-tools no longer supports Java version before 21` | JDK が 21 未満 | JDK 21 を導入し `JAVA_HOME` を切り替え |
| Functions 呼び出しが 404 → CORSエラー | `.env` の `projectId` と Emulator の起動プロジェクトが不一致 | 両者を一致させる（`.firebaserc` の `default` を確認） |
| キャラの一言がコード内蔵の台詞になる | `characterDialogues` が未投入 | seed を Emulator に対して実行（Unit 8 はマスター未取得でも内蔵台詞にフォールバックする） |

### データの永続化（任意）
Emulator を停止するとデータは消える。保持したい場合:
```
firebase emulators:start --import ./.emulator-data --export-on-exit
```

> **本番デプロイ前の切り戻し**: `.env` の `VITE_FIREBASE_*` を実プロジェクトの値に、`VITE_USE_EMULATOR=false`、`LLM_PROVIDER=anthropic` へ戻す。`projectId` が実プロジェクトのまま `VITE_USE_EMULATOR=false` にすると本番Firestoreへ書き込まれるため注意。
