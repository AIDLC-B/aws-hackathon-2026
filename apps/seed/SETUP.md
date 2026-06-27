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
