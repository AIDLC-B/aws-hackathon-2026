# Application Design（統合ドキュメント）

## 設計方針サマリー

| 項目 | 方針 |
|---|---|
| **アーキテクチャ** | Firebase全面採用 + Anthropic Claude API |
| **フロントエンド** | React + TypeScript、FSD的4階層モデル |
| **データアクセス** | フロントエンドからFirestore・Cloud Storage直接操作（Security Rules保護） |
| **CRUD責務分離** | 2層構造（共通: 汎用Firestoreプリミティブ@shared / ドメイン固有: 各feature hooks） |
| **Cloud Functions** | 最小限（Claude API呼び出し + ビジネスロジック） |
| **ストレージ** | Cloud Storageへブラウザ直接アクセス（アップロード・読み取り）、Storage Security Rulesで本人限定 |
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
| `difficultyMaster/{difficultyId}` | 難易度マスター（id, label, order） | 全認証ユーザー読み取り可、管理者のみ書き込み |
| `rarityMaster/{rarityId}` | レアリティマスター（id, label, order・確率はgachaConfig） | 全認証ユーザー読み取り可、管理者のみ書き込み |

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
    
    // 難易度・レアリティマスター: 認証ユーザーは読み取りのみ
    match /difficultyMaster/{difficultyId} {
      allow read: if request.auth != null;
      allow write: if false; // 管理者はAdmin SDKで操作
    }
    match /rarityMaster/{rarityId} {
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

## Cloud Storage アクセス設計

### アクセス方針
- **アップロード**: ブラウザ（Firebase SDK）から Cloud Storage へ直接アップロード
- **読み取り**: ブラウザから Cloud Storage の画像URLを直接参照
- **Cloud Functions非経由**: 署名付きURL発行などのサーバー処理を挟まず、Security Rulesで保護
- **画像認識との関係**: CF-01（analyzeRecipeImage）は認識処理のみを担当し、ストレージ保存はフロントエンドが直接実施

### ディレクトリ構成
```
recipe-images/{uid}/{recipeId}.jpg      # 料理写真（本人のみ読み書き）
```

### Cloud Storage Security Rules 概要

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // 料理写真: 本人のディレクトリのみ読み書き可
    match /recipe-images/{uid}/{fileName} {
      // 読み取り: 本人のみ
      allow read: if request.auth != null && request.auth.uid == uid;

      // 書き込み: 本人のみ + 画像のみ + 5MB以下
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');

      // 削除: 本人のみ
      allow delete: if request.auth != null && request.auth.uid == uid;
    }

    // その他のパスはすべて拒否
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### セキュリティ確保のポイント
1. **本人ディレクトリ限定**: `recipe-images/{uid}/` のパスで `request.auth.uid == uid` を強制
2. **ファイルサイズ制限**: 5MB以下（アップロード前のフロントエンド圧縮（最大1MB）と二重防御）
3. **MIME型制限**: `image/*` のみ許可（不正なファイルアップロード防止）
4. **デフォルト拒否**: 定義外パスはすべて `allow read, write: if false`

---

## フロントエンド FSD ディレクトリ構造

> **モノレポ構成（2026-06-27確定）**: リポジトリはnpm workspaces（`apps/*`）。フロントは `apps/web`、共通型は `apps/shared`、backendは `apps/functions`、seedは `apps/seed`。フロント/Functions共通の型は中立 `apps/shared/types` が単一ソースで、`apps/web/src/shared/types` は `@shared/types` から再エクスポート（+フロント専用UI型）、`apps/functions/src/types.ts` も同じ中立を再エクスポートする。

```
apps/
├── shared/types/               # ★中立・型の単一ソース（フロント/Functions共通）
├── web/                        # @damesi/web（Viteフロント）
│   └── src/
│       ├── app/                # アプリ初期化・ルーティング・プロバイダー
│       ├── features/           # 機能別モジュール（8ドメイン）
│       │   ├── auth/           # 認証
│       │   ├── onboarding/     # オンボーディング
│       │   ├── recipe/         # 料理管理（FR-01）
│       │   ├── suggestion/     # 献立提案（FR-02）
│       │   ├── gacha/          # ガチャ（FR-05）
│       │   ├── confirmedMenu/  # 確定済み献立
│       │   ├── character/      # AIキャラクター（FR-03）
│       │   └── settings/       # 設定
│       ├── shared/             # 共有（UI Element, hooks, lib, types[=apps/shared再エクスポート+UI型]）
│       │   └── hooks/          # 汎用Firestoreプリミティブ（useCollection, useDocument）
│       └── assets/             # 静的アセット（キャラクター画像, ガチャ画像）
├── functions/                  # @damesi/functions（Cloud Functions）
└── seed/                       # @damesi/seed（マスターデータ投入）
```

---

## CRUD責務分離（2層構造）

各featureに散在していたFirestore CRUDを2層に分離し、SDK直接依存をshared層に集約する。

### 層1: 汎用Firestoreプリミティブ（shared/hooks）

| プリミティブ | 役割 |
|---|---|
| `useCollection<T>(path, queryConstraints?)` | コレクションのリアルタイム購読 + 汎用 create/createWithId/getOnce。型はジェネリック `<T>` |
| `useDocument<T>(path)` | 単一ドキュメントのリアルタイム購読 + 汎用 update/remove/getOne |

- **共通化する横断的関心事**: ローディング状態、エラーハンドリング、購読解除（unsubscribe）、型安全性
- **特徴**: コレクション非依存の薄いラッパー。Firestore SDKへの依存はこの層のみ

### 層2: ドメイン固有CRUD（各feature/hooks）

- プリミティブを内部利用し、**コレクションパス・スキーマ・バリデーション・業務ルール**を保持
- Firestore SDKを直接呼ばない
- 例: `useRecipes()` → 内部で `useCollection<Recipe>('users/{uid}/recipes')`

```
[Component] → [層2: useRecipes / useConfirmedMenu 等（業務ルール・バリデーション）]
            → [層1: useCollection / useDocument（汎用・型安全・共通エラー/ローディング）]
            → [Firestore SDK]
```

### 効果
- CRUDロジックの重複排除
- エラー/ローディング状態管理の一元化
- ジェネリック型による型安全性の確保
- ドメインロジックとデータアクセス基盤の関心分離

---

## マスターデータ管理方針

enum的な埋め込み値のうち、付随属性を持つものをマスター化し、純粋な制御フロー/分類用enumはコード（TypeScript union型）に残す。

### マスター化の判定基準
- **マスター化する**: 付随属性（ラベル・表示順・色・確率など）を持つ／表示・計算で参照される／将来変更し得る
- **コードのまま残す**: 付随属性を持たない制御フロー/分類用enum／UIロジックに密結合／型安全性を優先

### 対象一覧

| 値 | 扱い | 保存場所 | 属性 |
|---|---|---|---|
| `difficulty` (easy/normal/hard) | マスター化 | Firestore `difficultyMaster` | id, label, order |
| `rarity` (N/R/SR/SSR) | マスター化（表示属性） | Firestore `rarityMaster` | id, label, order（確率は `gachaConfig`） |
| `tone` / `trigger` / `from` / `source` | コードのまま | TypeScript union型 | — |
| `characterId` (7キャラ) | コードのまま（今回マスター化しない） | TypeScript union型 + 静的アセット | — |

### 取得・キャッシュ
- **MasterDataProvider（app/providers）**: 起動時に `difficultyMaster` / `rarityMaster` を1回ずつ取得（getOnce）し、Context経由で全体提供
- **セッション内キャッシュ**: 再取得なし（Firestore読み取り最小化）
- **参照**: コンポーネントは `useMasterData()` でラベル・表示順を取得。ドキュメントには識別子（id文字列）のみ保存
- **保護**: Security Rulesで読み取り専用（書き込みはAdmin SDKのみ）

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
