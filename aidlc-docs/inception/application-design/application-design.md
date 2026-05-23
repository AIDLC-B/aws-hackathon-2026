# Application Design（統合ドキュメント）

## 設計方針サマリー

| 項目 | 方針 |
|---|---|
| **アーキテクチャ** | Firebase全面採用 + Anthropic Claude API |
| **フロントエンド** | React + TypeScript、FSD的4階層モデル |
| **データアクセス** | フロントエンドからFirestore直接操作（Security Rules保護） |
| **Cloud Functions** | 最小限（Claude API呼び出し + ビジネスロジック） |
| **認証** | Firebase Authentication（メール+パスワード） |
| **データモデル** | ハイブリッド（ユーザーデータ=サブコレクション、マスターデータ=トップレベル） |
| **コスト最適化** | Firebase無料枠内運用、非正規化でFirestore読み取り削減 |
| **セキュリティ** | Firestore Security Rules + Cloud Functions認証 |

---

## システム構成図

```
+---------------------------------------------------------------+
|                        ブラウザ（React SPA）                    |
|                                                               |
|  +------------------+  +------------------+  +--------------+ |
|  | features/auth    |  | features/recipe  |  | features/    | |
|  | features/onboard |  | features/confirm |  | suggestion   | |
|  | features/settings|  | features/charact |  | features/    | |
|  |                  |  |                  |  | gacha        | |
|  +--------+---------+  +--------+---------+  +------+-------+ |
|           |                      |                   |         |
+---------------------------------------------------------------+
            |                      |                   |
            v                      v                   v
+-------------------+  +-------------------+  +-------------------+
| Firebase Auth     |  | Cloud Firestore   |  | Cloud Functions   |
| (認証)            |  | (データ)          |  | (ロジック)        |
+-------------------+  +-------------------+  +-------------------+
                                                       |
                              +-------------------------+
                              |
                              v
                    +-------------------+  +-------------------+
                    | Claude API        |  | Cloud Storage     |
                    | (Anthropic)       |  | (料理写真)        |
                    +-------------------+  +-------------------+
```

---

## Cloud Functions 一覧

| ID | 名前 | 責務 | トリガー |
|---|---|---|---|
| CF-01 | analyzeRecipeImage | 料理写真をClaude APIで認識 | HTTPS Callable |
| CF-02 | suggestMeals | フィルタリング + 3品提案 | HTTPS Callable |
| CF-03 | spinGacha | レアリティ抽選 + レシピ選択 | HTTPS Callable |

### Cloud Functions の設計原則
- **認証必須**: 全Callable Functionsは `request.auth` を検証
- **Admin SDK使用**: Firestore操作はAdmin SDKで実行（Security Rulesをバイパス）
- **Secret Manager**: Claude APIキーはSecret Manager経由で取得
- **エラーハンドリング**: HttpsError で適切なエラーコードを返却
- **バリデーション**: 入力パラメータを厳密に検証

---

## Firestore コレクション構成

### ユーザー固有データ（サブコレクション）

| パス | 用途 | アクセス |
|---|---|---|
| `users/{uid}` | ユーザープロフィール | 本人のみ読み書き |
| `users/{uid}/recipes/{recipeId}` | 料理レパートリー | 本人のみ読み書き |
| `users/{uid}/confirmedMenuItems/{itemId}` | 確定済み献立 | 本人のみ読み書き |

### マスターデータ（トップレベルコレクション）

| パス | 用途 | アクセス |
|---|---|---|
| `characterDialogues/{dialogueId}` | キャラクター台詞 | 全認証ユーザー読み取り可、管理者のみ書き込み |
| `gachaConfig/{configId}` | ガチャ確率設定 | Cloud Functionsのみ読み取り、管理者のみ書き込み |

---

## Firestore Security Rules 概要

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ユーザードキュメント: 本人のみ
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      
      // レシピ: 本人のみ
      match /recipes/{recipeId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      
      // 確定済み献立: 本人のみ
      match /confirmedMenuItems/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    
    // キャラクター台詞マスター: 認証ユーザーは読み取りのみ
    match /characterDialogues/{dialogueId} {
      allow read: if request.auth != null;
      allow write: if false; // 管理者はAdmin SDKで操作
    }
    
    // ガチャ設定: Cloud Functionsのみ（Admin SDK）
    match /gachaConfig/{configId} {
      allow read, write: if false; // Admin SDKのみ
    }
  }
}
```

---

## フロントエンド FSD ディレクトリ構造

```
src/
├── app/                    # アプリ初期化・ルーティング・プロバイダー
├── features/               # 機能別モジュール（8ドメイン）
│   ├── auth/               # 認証
│   ├── onboarding/         # オンボーディング
│   ├── recipe/             # 料理管理（FR-01）
│   ├── suggestion/         # 献立提案（FR-02）
│   ├── gacha/              # ガチャ（FR-05）
│   ├── confirmedMenu/      # 確定済み献立
│   ├── character/          # AIキャラクター（FR-03）
│   └── settings/           # 設定
├── shared/                 # 共有（UI Element, hooks, lib, types）
└── assets/                 # 静的アセット（キャラクター画像, ガチャ画像）
```

---

## キャラクタードメインIF設計

### 呼び出しインターフェース
- **入力**: `{ trigger, from }` のみ
- **内部決定**: キャラクター選択、トーン選択、台詞選択
- **参照データ**: AuthContext（isPremium, favoriteCharacters）、Firestore（characterDialogues）
- **出力**: `{ characterId, characterName, characterImage, message, tone }`

### trigger一覧と表示方式

| trigger | 表示方式 | 発火タイミング |
|---|---|---|
| meal_decided | ボトムシート | 提案から献立確定時 |
| gacha_decided | ボトムシート | ガチャから献立確定時 |
| meal_completed | ボトムシート | 「つくったよ！」押下時 |
| recipe_registered | ボトムシート | 料理登録完了時 |
| meal_suggested | インライン | フィルタリング画面表示時 |
| gacha_reroll_limit | 専用画面 | リセマラ5回目（メシストフェレス固定） |

### from値一覧

| from | 説明 |
|---|---|
| suggestion | 提案フローから |
| gacha | シングルガチャから |
| gacha_10 | 10連ガチャから |
| detail | レシピ詳細画面から |
| list | 献立リスト画面から |
| registration | 料理登録画面から |
| onboarding | オンボーディングから |
| filtering | フィルタリング画面から |

---

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| Firestoreコレクション | camelCase | recipes, confirmedMenuItems, characterDialogues |
| Firestoreフィールド | camelCase | recipeName, createdAt, isPremium |
| Cloud Functions | camelCase | analyzeRecipeImage, suggestMeals, spinGacha |
| Reactコンポーネント | PascalCase | RecipeForm, GachaSpinner, CharacterBottomSheet |
| hooks | camelCase (use prefix) | useRecipes, useGacha, useCharacterDialogue |
| 型定義 | PascalCase | Recipe, ConfirmedMenuItem, CharacterDialogue |
| 定数 | UPPER_SNAKE_CASE | GACHA_REROLL_LIMIT, DEFAULT_FILTER |

---

## コスト最適化設計

### Firestore読み取り削減策
1. **非正規化**: confirmedMenuItemsにレシピ基本情報をコピー保持（リスト表示時の追加読み取り不要）
2. **キャラクター台詞キャッシュ**: フロントエンドでセッション内キャッシュ（同一trigger/toneの再取得を防止）
3. **レシピ一覧キャッシュ**: Firestoreのオフラインキャッシュ機能を活用

### Cloud Functions呼び出し削減策
1. **キャラクター台詞**: Cloud Functionsを使わずFirestore直接読み取り
2. **レシピCRUD**: Cloud Functionsを使わずFirestore直接操作
3. **確定済み献立CRUD**: Cloud Functionsを使わずFirestore直接操作

### Cloud Storage最適化
1. **画像圧縮**: アップロード前にフロントエンドで圧縮（最大1MB）
2. **サムネイル**: 一覧表示用の小さい画像はCSSリサイズで対応（Cloud Functions不使用）

---

## 詳細設計ドキュメント参照

- コンポーネント詳細: [components.md](./components.md)
- メソッド定義: [component-methods.md](./component-methods.md)
- サービス層: [services.md](./services.md)
- 依存関係: [component-dependency.md](./component-dependency.md)
