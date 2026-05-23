# コンポーネントメソッド定義

## フロントエンドサービス層

### features/auth/hooks/useAuth.ts

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| signUp | `{ email, password, nickname }` | `User` | Firebase Authでアカウント作成 + Firestoreにユーザードキュメント作成 |
| signIn | `{ email, password }` | `User` | Firebase Authでログイン |
| signOut | なし | `void` | Firebase Authでログアウト + ローカルキャッシュクリア |
| onAuthStateChanged | `callback` | `Unsubscribe` | 認証状態の変更を監視 |

### features/recipe/hooks/useRecipes.ts

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| addRecipe | `RecipeInput` | `string (recipeId)` | Firestoreにレシピ追加（users/{uid}/recipes） |
| updateRecipe | `{ recipeId, data: Partial<Recipe> }` | `void` | レシピ更新 |
| deleteRecipe | `recipeId` | `void` | レシピ削除 |
| getRecipes | なし | `Recipe[]` | 全レパートリー取得 |
| getRecipeById | `recipeId` | `Recipe` | 単一レシピ取得 |
| getRecipeCount | なし | `number` | レパートリー件数取得 |

### features/suggestion/hooks/useSuggestion.ts

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| suggestMeals | `{ mood, duration, difficulty }` | `SuggestionResult` | Cloud Functions CF-02を呼び出し |
| confirmMeal | `{ recipeId, source }` | `void` | 確定済み献立に追加（Firestore直接書き込み） |

### features/gacha/hooks/useGacha.ts

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| spinGacha | `{ count: 1 \| 10 }` | `GachaResult[]` | Cloud Functions CF-03を呼び出し |
| confirmGachaResult | `{ results: GachaResult[], mode: "add" \| "replace" }` | `void` | ガチャ結果を確定済み献立に追加/入れ替え |

### features/confirmedMenu/hooks/useConfirmedMenu.ts

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| getConfirmedMenuItems | なし | `ConfirmedMenuItem[]` | 確定済み献立一覧取得 |
| getConfirmedMenuCount | なし | `number` | 確定済み献立件数取得 |
| completeMenuItem | `itemId` | `void` | 「つくったよ！」で献立を削除 |
| clearAllMenuItems | なし | `void` | 全献立削除（10連ガチャ入れ替え時） |

### features/character/hooks/useCharacterDialogue.ts

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

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| completeOnboarding | `selectedRecipeIds: string[]` | `void` | 選択した料理をレパートリーに一括追加 + isOnboardingCompleted=true |

### features/settings/hooks/useSettings.ts

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| updateFavoriteCharacters | `characterIds: string[]` | `void` | 推しキャラ設定を更新 |
| getUserProfile | なし | `UserProfile` | ユーザープロフィール取得 |

---

## Cloud Functions エンドポイント定義

### CF-01: analyzeRecipeImage

```typescript
// HTTPS Callable Function
export const analyzeRecipeImage = onCall(async (request) => {
  // 入力: { imageBase64: string }
  // 処理: Claude API (Vision) に画像を送信して料理情報を認識
  // 出力: { name: string, difficulty: string, duration: number, rarity: string }
  // エラー: 認識失敗時は { error: "recognition_failed" }
});
```

### CF-02: suggestMeals

```typescript
// HTTPS Callable Function
export const suggestMeals = onCall(async (request) => {
  // 入力: { mood: string, duration: string, difficulty: string }
  // 処理:
  //   1. request.auth.uid からユーザーのレシピを取得
  //   2. confirmedMenuItems を取得して除外
  //   3. フィルタリング条件で絞り込み
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
  //   3. gachaConfig からレアリティ確率を取得
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
  .where("duration", "<=", durationFilter)
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
