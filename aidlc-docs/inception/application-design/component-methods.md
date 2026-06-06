# コンポーネントメソッド定義

## 共通層: 汎用Firestoreプリミティブ（shared/hooks）

Firestore SDKへの直接依存はこの層に集約する。各ドメイン固有hooksはこれらのプリミティブを内部利用し、SDKを直接呼ばない。

### shared/hooks/useCollection.ts

ジェネリック型 `<T>` でコレクションを扱う薄いラッパー。エラー・ローディング・購読解除を共通化。

| メソッド/戻り値 | 入力 | 出力 | 説明 |
|---|---|---|---|
| useCollection&lt;T&gt; | `path: string`, `queryConstraints?` | `{ data: T[], loading, error }` | コレクションをリアルタイム購読（onSnapshot）。アンマウント時に自動unsubscribe |
| create | `path: string`, `data: T` | `string (docId)` | ドキュメント追加（addDoc） |
| createWithId | `path: string`, `id: string`, `data: T` | `void` | ID指定でドキュメント作成（setDoc） |
| getOnce&lt;T&gt; | `path: string`, `queryConstraints?` | `T[]` | 一度だけ取得（getDocs・購読なし） |

### shared/hooks/useDocument.ts

| メソッド/戻り値 | 入力 | 出力 | 説明 |
|---|---|---|---|
| useDocument&lt;T&gt; | `path: string` | `{ data: T \| null, loading, error }` | 単一ドキュメントをリアルタイム購読。アンマウント時に自動unsubscribe |
| update | `path: string`, `data: Partial<T>` | `void` | ドキュメント更新（updateDoc） |
| remove | `path: string` | `void` | ドキュメント削除（deleteDoc） |
| getOne&lt;T&gt; | `path: string` | `T \| null` | 一度だけ取得（getDoc・購読なし） |

**共通化される横断的関心事**:
- **ローディング状態**: 各操作中の `loading` フラグ
- **エラーハンドリング**: Firestoreエラーを統一形式の `error` で返却
- **購読解除**: `useEffect` のクリーンアップで `unsubscribe()` を自動実行
- **型安全性**: ジェネリック `<T>` でコレクション/ドキュメントの型を保証

### shared/hooks/useMasterData.ts

マスターデータ（difficulty / rarity）へのアクセサ。`MasterDataProvider` がセッション内で一度だけ取得・キャッシュした値を参照する（再取得によるFirestore読み取りを防止）。

| メソッド/戻り値 | 入力 | 出力 | 説明 |
|---|---|---|---|
| useMasterData | なし | `{ difficulties: DifficultyMaster[], rarities: RarityMaster[], loading }` | キャッシュ済みマスターを返却 |
| getDifficultyLabel | `id: string` | `string` | difficulty識別子から日本語ラベルを取得 |
| getRarityLabel | `id: string` | `string` | rarity識別子から表示ラベルを取得 |

> **MasterDataProvider（app/providers）**: アプリ起動時に `getOnce<DifficultyMaster>('difficultyMaster')` と `getOnce<RarityMaster>('rarityMaster')` を1回ずつ実行し、Context経由でアプリ全体に提供。マスターは読み取り専用（Security Rulesで保護）。

---

## ドメイン固有層: フロントエンドサービス層（各feature）

各ドメインhooksは上記プリミティブを内部利用し、コレクションパス・スキーマ・バリデーション・業務ルールを保持する。

### features/auth/hooks/useAuth.ts

> **内部実装**: Firebase Auth SDK + `useDocument<UserProfile>('users/{uid}')`（createWithId/getOne）でユーザードキュメントを管理。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| signUp | `{ email, password, nickname }` | `User` | Firebase Authでアカウント作成 + Firestoreにユーザードキュメント作成 |
| signIn | `{ email, password }` | `User` | Firebase Authでログイン |
| signOut | なし | `void` | Firebase Authでログアウト + ローカルキャッシュクリア |
| onAuthStateChanged | `callback` | `Unsubscribe` | 認証状態の変更を監視 |

### features/recipe/hooks/useRecipes.ts

> **内部実装**: `useCollection<Recipe>('users/{uid}/recipes')` を利用。コレクションパス・Recipeスキーマ・バリデーション（必須項目・難易度enum等）・業務ルールを本hookが保持。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| addRecipe | `RecipeInput` | `string (recipeId)` | バリデーション後、プリミティブ create で追加（users/{uid}/recipes） |
| updateRecipe | `{ recipeId, data: Partial<Recipe> }` | `void` | プリミティブ update で更新 |
| deleteRecipe | `recipeId` | `void` | プリミティブ remove で削除 |
| getRecipes | なし | `Recipe[]` | useCollection の購読データを返却 |
| getRecipeById | `recipeId` | `Recipe` | useDocument で単一取得 |
| getRecipeCount | なし | `number` | useCollection のデータ件数 |
| uploadRecipeImage | `{ recipeId, file }` | `string (imageUrl)` | Cloud Storageへ直接アップロード（圧縮後）しダウンロードURLを返却（shared/lib/storage.ts経由） |
| deleteRecipeImage | `recipeId` | `void` | Cloud Storageから画像を直接削除 |

### features/suggestion/hooks/useSuggestion.ts

> **内部実装**: 提案は Cloud Functions CF-02 を呼び出し。`confirmMeal` は `useCollection<ConfirmedMenuItem>('users/{uid}/confirmedMenuItems')` の create で直接書き込み。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| suggestMeals | `{ mood?, duration: number, difficulty }` | `SuggestionResult` | Cloud Functions CF-02を呼び出し（moodは現状未使用・将来拡張用） |
| confirmMeal | `{ recipeId, source }` | `void` | 確定済み献立に追加（Firestore直接書き込み） |

### features/gacha/hooks/useGacha.ts

> **内部実装**: 抽選は Cloud Functions CF-03 を呼び出し。`confirmGachaResult` は `useCollection<ConfirmedMenuItem>('users/{uid}/confirmedMenuItems')` の create（add時）/ clearAll+create（replace時）で直接書き込み。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| spinGacha | `{ count: 1 \| 10 }` | `GachaResult[]` | Cloud Functions CF-03を呼び出し |
| confirmGachaResult | `{ results: GachaResult[], mode: "add" \| "replace" }` | `void` | ガチャ結果を確定済み献立に追加/入れ替え |

### features/confirmedMenu/hooks/useConfirmedMenu.ts

> **内部実装**: `useCollection<ConfirmedMenuItem>('users/{uid}/confirmedMenuItems')` を利用。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| getConfirmedMenuItems | なし | `ConfirmedMenuItem[]` | useCollection の購読データを返却 |
| getConfirmedMenuCount | なし | `number` | useCollection のデータ件数 |
| completeMenuItem | `itemId` | `void` | プリミティブ remove で削除（「つくったよ！」） |
| clearAllMenuItems | なし | `void` | 全件削除（10連ガチャ入れ替え時・remove を反復） |

### features/character/hooks/useCharacterDialogue.ts

> **内部実装**: `useCollection<CharacterDialogue>('characterDialogues')`（getOnce）を利用してマスターデータを取得。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| getDialogue | `{ trigger, from, isPremium, favoriteCharacters? }` | `CharacterDialogue` | マスターデータからキャラクター・トーンを選択して台詞を返却 |

**キャラクタードメインIF設計（前回確定分を維持）**:
- 呼び出し元は `trigger`（発火タイミング）と `from`（画面遷移元）のみを渡す
- キャラクター選択・トーン選択はキャラクターモジュール内部で決定
- `isPremium` と `favoriteCharacters` はAuthContextから自動取得

**trigger × from 対応表**:

| trigger | from | 表示方式 |
|---|---|---|
| meal_decided | suggestion | ボトムシート |
| gacha_decided | gacha / gacha_10 | ボトムシート |
| meal_completed | detail / list | ボトムシート |
| recipe_registered | registration / onboarding | ボトムシート |
| meal_suggested | filtering | インライン |
| gacha_reroll_limit | gacha / gacha_10 | 専用画面（メシストフェレス固定） |

### features/onboarding/hooks/useOnboarding.ts

> **内部実装**: `useCollection<Recipe>('users/{uid}/recipes')` の create を反復 + `useDocument<UserProfile>('users/{uid}')` の update で完了フラグ更新。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| completeOnboarding | `selectedRecipeIds: string[]` | `void` | 選択した料理をレパートリーに一括追加 + isOnboardingCompleted=true |

### features/settings/hooks/useSettings.ts

> **内部実装**: `useDocument<UserProfile>('users/{uid}')` を利用。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| updateFavoriteCharacters | `characterIds: string[]` | `void` | プリミティブ update で推しキャラ設定を更新 |
| getUserProfile | なし | `UserProfile` | useDocument の購読データを返却 |

---

## Cloud Functions エンドポイント定義

### CF-01: analyzeRecipeImage

```typescript
// HTTPS Callable Function
export const analyzeRecipeImage = onCall(async (request) => {
  // 入力: { imageUrl: string }（Cloud Storageへ直接アップロード済みの画像URL）
  // 処理: imageUrlの画像をClaude API (Vision) に渡して料理情報を認識
  // 出力: { name: string, difficulty: string, duration: number, rarity: string }
  // エラー: 認識失敗時は { error: "recognition_failed" }
});
```

### CF-02: suggestMeals

```typescript
// HTTPS Callable Function
export const suggestMeals = onCall(async (request) => {
  // 入力: { mood?: string, duration: number, difficulty: string }
  //   - duration は number（分）。recipes.duration と直接比較（型変換不要）
  //   - mood は現状フィルタ未使用（将来拡張用の予約パラメータ・受け取るが無視）
  // 処理:
  //   1. request.auth.uid からユーザーのレシピを取得
  //   2. confirmedMenuItems を取得して除外
  //   3. difficulty / duration で絞り込み（mood は無視）
  //   4. ランダムで最大3品選択
  // 出力: { suggestions: Recipe[], totalCount: number, needsGachaRedirect: boolean }
});
```

### CF-03: spinGacha

```typescript
// HTTPS Callable Function
export const spinGacha = onCall(async (request) => {
  // 入力: { count: 1 | 10 }
  // 処理:
  //   1. request.auth.uid からユーザーのレシピを取得
  //   2. confirmedMenuItems を取得して除外
  //   3. gachaConfig からレアリティ確率を取得（デフォルト値: N=60%, R=25%, SR=12%, SSR=3%）
  //   4. 確率に基づきレアリティを決定
  //   5. 該当レアリティのレシピからランダム選択
  //   6. count分繰り返し（重複なし）
  // 出力: { results: { recipe: Recipe, rarity: string }[] }
  // バリデーション: count は 1 または 10 のみ許可
});
```

---

## Firestoreクエリパターン

### レシピ取得（全件）
```
db.collection("users").doc(uid).collection("recipes").get()
```

### レシピ取得（フィルタリング）— CF-02内で実行
```
db.collection("users").doc(uid).collection("recipes")
  .where("difficulty", "==", difficultyFilter)
  .where("duration", "<=", durationFilter)   // durationFilter は number（分）。recipes.duration と同一型で比較
  .get()
```

### 確定済み献立取得
```
db.collection("users").doc(uid).collection("confirmedMenuItems")
  .orderBy("confirmedAt", "desc")
  .get()
```

### キャラクター台詞取得（trigger + tone条件）
```
db.collection("characterDialogues")
  .where("trigger", "==", trigger)
  .where("isPremium", "==", false)  // or isPremium in [true, false] for premium users
  .get()
```

### ユーザープロフィール取得
```
db.collection("users").doc(uid).get()
```

### マスターデータ取得（起動時に一度のみ・MasterDataProvider内）
```
db.collection("difficultyMaster").orderBy("order").get()
db.collection("rarityMaster").orderBy("order").get()
```
