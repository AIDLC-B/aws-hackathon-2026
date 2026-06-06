# コンポーネント設計

## コンポーネント設計指針

### 4階層モデル（FSD的構成）
| 階層 | 役割 | 例 |
|---|---|---|
| **Page** | ルーティング対応・レイアウト構成 | LoginPage, HomePage, GachaPage |
| **Widget** | 複数Feature Componentを組み合わせた画面セクション | SuggestionWidget, GachaResultWidget |
| **Feature Component** | 単一機能の実装（Container/Presentational分離） | RecipeForm, GachaSpinner, CharacterBottomSheet |
| **UI Element** | 再利用可能な汎用UIパーツ | Button, Card, Modal, BottomSheet |

### 結合方針
- **Feature間の直接依存禁止**: Feature同士はshared層を経由して通信
- **Container/Presentational分離**: ロジック（Container）と表示（Presentational）を分離
- **依存方向の厳格化**: UI Element ← Feature Component ← Widget ← Page（逆方向禁止）

### CRUD責務分離（2層構造）
| 層 | 配置 | 責務 |
|---|---|---|
| **層1: 汎用Firestoreプリミティブ** | `shared/hooks/`（useCollection, useDocument） | コレクション非依存の薄いラッパー。ジェネリック型 `<T>` で型安全な購読・create/update/delete を提供。エラー・ローディング・購読解除（unsubscribe）を共通化 |
| **層2: ドメイン固有CRUD** | 各 `features/*/hooks/`（useRecipes 等） | プリミティブを内部利用。コレクションパス・スキーマ・バリデーション・業務ルールを保持。例: `useRecipes()` が内部で `useCollection<Recipe>('users/{uid}/recipes')` を呼ぶ |

- **原則**: Firestore SDKへの直接依存は層1に集約。層2およびコンポーネントはSDKを直接呼ばない
- **効果**: CRUDロジックの重複排除、エラー/ローディング状態管理の一元化、型安全性の確保

---

## フロントエンドコンポーネント構成

### ディレクトリ構造

```
src/
├── app/                          # アプリケーション初期化・ルーティング
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
│       ├── AuthProvider.tsx       # Firebase Auth状態管理
│       ├── MasterDataProvider.tsx # マスターデータ（difficulty/rarity）をセッション内で一度だけ取得・キャッシュ
│       └── AppProvider.tsx        # グローバル状態
│
├── features/                     # 機能別モジュール
│   ├── auth/                     # 認証ドメイン
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   └── hooks/
│   │       └── useAuth.ts        # Firebase Auth操作
│   │
│   ├── onboarding/               # オンボーディングドメイン
│   │   ├── pages/
│   │   │   └── OnboardingPage.tsx
│   │   ├── components/
│   │   │   └── RecipeSelector.tsx
│   │   ├── hooks/
│   │   │   └── useOnboarding.ts  # レパートリー一括追加・完了フラグ更新
│   │   └── data/
│   │       └── onboardingRecipes.ts  # 固定20件データ
│   │
│   ├── recipe/                   # 料理管理ドメイン（FR-01）
│   │   ├── pages/
│   │   │   ├── RecipeListPage.tsx
│   │   │   ├── RecipeDetailPage.tsx
│   │   │   └── RecipeEditPage.tsx
│   │   ├── components/
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── RecipeCard.tsx
│   │   │   └── RecipeList.tsx
│   │   └── hooks/
│   │       └── useRecipes.ts     # Firestore CRUD操作
│   │
│   ├── suggestion/               # 献立提案ドメイン（FR-02）
│   │   ├── pages/
│   │   │   ├── SelectionPage.tsx     # 選択画面
│   │   │   └── FilteringPage.tsx     # フィルタリング画面
│   │   ├── components/
│   │   │   ├── SelectionButtons.tsx
│   │   │   ├── FilterForm.tsx
│   │   │   └── SuggestionResult.tsx
│   │   └── hooks/
│   │       └── useSuggestion.ts  # Cloud Functions呼び出し
│   │
│   ├── gacha/                    # ガチャドメイン（FR-05）
│   │   ├── pages/
│   │   │   └── GachaPage.tsx
│   │   ├── components/
│   │   │   ├── GachaSpinner.tsx      # カプセルトイ演出
│   │   │   ├── GachaResult.tsx
│   │   │   └── RerollLimitScreen.tsx # 堕落ルート画面
│   │   └── hooks/
│   │       └── useGacha.ts       # Cloud Functions呼び出し
│   │
│   ├── confirmedMenu/            # 確定済み献立ドメイン
│   │   ├── pages/
│   │   │   └── MenuListPage.tsx      # 献立リスト画面
│   │   ├── components/
│   │   │   └── MenuItemCard.tsx
│   │   └── hooks/
│   │       └── useConfirmedMenu.ts   # Firestore CRUD操作
│   │
│   ├── character/                # AIキャラクタードメイン（FR-03）
│   │   ├── components/
│   │   │   ├── CharacterBottomSheet.tsx
│   │   │   └── CharacterInline.tsx   # meal_suggested用インライン表示
│   │   └── hooks/
│   │       └── useCharacterDialogue.ts  # マスターデータ取得・選択ロジック
│   │
│   └── settings/                 # 設定ドメイン
│       ├── pages/
│       │   └── SettingsPage.tsx
│       ├── components/
│       │   └── PremiumSettings.tsx
│       └── hooks/
│           └── useSettings.ts    # プロフィール取得・推しキャラ設定更新
│
├── shared/                       # 共有モジュール
│   ├── components/
│   │   └── ui/                   # UI Element集約
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── BottomSheet.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useCollection.ts      # 汎用Firestoreプリミティブ（コレクション購読・create/add）
│   │   ├── useDocument.ts        # 汎用Firestoreプリミティブ（ドキュメント購読・update/delete）
│   │   └── useMasterData.ts      # マスターデータ（difficulty/rarity）アクセサ（MasterDataProviderのキャッシュを参照）
│   ├── lib/
│   │   ├── firebase.ts           # Firebase初期化
│   │   ├── functions.ts          # Cloud Functions呼び出しヘルパー
│   │   └── storage.ts            # Cloud Storage直接アクセスヘルパー（アップロード/URL取得/削除）
│   └── types/
│       └── index.ts              # 共通型定義
│
└── assets/                       # 静的アセット
    ├── characters/               # キャラクター画像
    └── gacha/                    # ガチャ演出画像
```

---

## Cloud Functions コンポーネント

### CF-01: analyzeRecipeImage
- **責務**: 料理写真をClaude APIに送信し、料理名・難易度・所要時間・頻度を認識
- **トリガー**: HTTPS Callable Function
- **入力**: `{ imageUrl: string }`（Cloud Storageへ直接アップロード済みの画像URL）
- **出力**: `{ name: string, difficulty: string, duration: number, rarity: string }`
- **APIキー管理**: Firebase Secret Manager経由でClaude APIキーを取得

### CF-02: suggestMeals
- **責務**: ユーザーのレパートリーからフィルタリング条件に基づき3品を提案
- **トリガー**: HTTPS Callable Function
- **入力**: `{ mood?: string, duration: number, difficulty: string }`
  - `duration`: 数値（分）。レシピの `duration: number` と直接比較（`duration <= 指定値`）。型変換は不要
  - `mood`: **現状フィルタには使用しない**（将来要件で気分タグ等による絞り込みを追加できるようにするための予約パラメータ。受け取るが処理では無視）
- **出力**: `{ suggestions: Recipe[], totalCount: number, needsGachaRedirect: boolean }`
- **処理**: Firestoreからユーザーのレシピを取得 → difficulty/duration でフィルタリング（moodは無視）→ ランダム3品選択
- **確定済み献立の除外**: confirmedMenuItemsサブコレクションを参照して除外

### CF-03: spinGacha
- **責務**: ガチャ抽選（レアリティ確率計算）を実行
- **トリガー**: HTTPS Callable Function
- **入力**: `{ count: 1 | 10 }`
- **出力**: `{ results: { recipe: Recipe, rarity: string }[] }`
- **処理**: Firestoreからユーザーのレシピを取得 → 確定済み献立を除外 → レアリティ確率に基づき抽選
- **確率設定**: `gachaConfig` コレクションから取得（デフォルト値: N=60%, R=25%, SR=12%, SSR=3%）。確率はハードコードせず、`gachaConfig` の `probability` を参照する

---

## Firestore コレクション設計

### ユーザー固有データ（サブコレクション構成）

```
users/{uid}
├── (ドキュメントフィールド)
│   ├── nickname: string
│   ├── email: string
│   ├── isPremium: boolean
│   ├── isOnboardingCompleted: boolean
│   ├── favoriteCharacters: string[]    # プレミアム: 推しキャラID配列
│   └── createdAt: timestamp
│
├── recipes/{recipeId}                  # 料理レパートリー
│   ├── name: string
│   ├── rarity: "N" | "R" | "SR" | "SSR"
│   ├── difficulty: "easy" | "normal" | "hard"
│   ├── duration: number (分)
│   ├── imageUrl: string | null
│   ├── ingredients: string | null
│   ├── steps: string | null
│   ├── memo: string | null
│   └── createdAt: timestamp
│
└── confirmedMenuItems/{itemId}         # 確定済み献立
    ├── recipeId: string
    ├── recipeName: string
    ├── rarity: string
    ├── difficulty: string
    ├── duration: number
    ├── confirmedAt: timestamp
    └── source: "suggestion" | "gacha" | "gacha_10"
```

### マスターデータ（トップレベルコレクション）

```
characterDialogues/{dialogueId}         # キャラクター台詞マスター
├── characterId: string                 # "saboeru" | "sabokachan" | "nyamake" | "chefrei" | "meshistopheles" | "sabot" | "sabowrashi"
├── trigger: string                     # "meal_decided" | "gacha_decided" | "meal_completed" | "recipe_registered" | "meal_suggested" | "gacha_reroll_limit"
├── tone: string                        # "encouragement" | "scolding" | "praise" | "empathy"
├── message: string
├── isPremium: boolean                  # プレミアム専用台詞かどうか
└── createdAt: timestamp

gachaConfig/{configId}                  # ガチャ確率設定（管理者用）
├── rarity: "N" | "R" | "SR" | "SSR"    # rarityMaster.id を参照
├── probability: number                 # 0.60, 0.25, 0.12, 0.03
└── updatedAt: timestamp

difficultyMaster/{difficultyId}         # 難易度マスター（表示属性）
├── id: "easy" | "normal" | "hard"      # recipes.difficulty が参照する識別子
├── label: string                       # 日本語表示名（例: "かんたん" / "ふつう" / "むずかしい"）
└── order: number                       # 表示順（昇順）

rarityMaster/{rarityId}                 # レアリティマスター（表示属性のみ・確率はgachaConfigが保持）
├── id: "N" | "R" | "SR" | "SSR"        # recipes.rarity が参照する識別子
├── label: string                       # 表示名（例: "N" / "R" / "SR" / "SSR"）
└── order: number                       # 表示順（昇順）
```

> **マスター化方針**: `difficulty` `rarity` は付随属性（ラベル・表示順）を持つためFirestoreマスターとして一元管理。recipes/confirmedMenuItems には識別子（id文字列）を保存し、表示時にマスターを参照。`rarity` の確率は引き続き `gachaConfig` が保持し、`rarityMaster` は表示属性のみを担当。`tone` `trigger` `from` `source` は付随属性を持たない制御フロー/分類用のためTypeScript union型としてコードに残す。`characterId` は今回マスター化しない。

---

## Cloud Storage 設計（ブラウザ直接アクセス）

- **アクセス方式**: フロントエンド（Firebase SDK）から Cloud Storage へ直接アップロード・読み取り（Cloud Functions非経由）
- **保存先**: `recipe-images/{uid}/{recipeId}.jpg`
- **ヘルパー**: `shared/lib/storage.ts`（アップロード・ダウンロードURL取得・削除）
- **アップロードフロー**: 圧縮（最大1MB）→ 直接アップロード → ダウンロードURL取得 → Firestoreの `imageUrl` に保存
- **保護**: Cloud Storage Security Rules で本人ディレクトリ限定・サイズ上限（5MB）・MIME型（image/*）制限
- **画像認識との関係**: CF-01（analyzeRecipeImage）は認識のみ担当。保存はフロントエンドが直接実施

---

## Firebase Authentication 統合設計

- **認証方式**: メールアドレス + パスワード
- **セッション管理**: Firebase Auth のトークン自動更新（デフォルト1時間、リフレッシュトークンで延長）
- **初回判定**: Firestoreの `users/{uid}.isOnboardingCompleted` フラグで判定
- **isPremium取得**: ログイン後に `users/{uid}` ドキュメントから取得し、AuthContext経由でアプリ全体に提供
- **Cloud Functions認証**: Callable Functionsは自動的にFirebase Authトークンを検証
