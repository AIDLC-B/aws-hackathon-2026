# コンポーネント依存関係

## 依存関係マトリクス

| コンポーネント | 依存先 | 通信方式 |
|---|---|---|
| features/auth | Firebase Auth, Firestore (users) | Firebase SDK直接 |
| features/onboarding | features/recipe (useRecipes), features/character | Firestore直接 |
| features/recipe | Firestore (users/{uid}/recipes), Cloud Storage | Firebase SDK直接 |
| features/suggestion | CF-02 (suggestMeals), features/confirmedMenu, features/character | Cloud Functions Callable |
| features/gacha | CF-03 (spinGacha), features/confirmedMenu, features/character | Cloud Functions Callable |
| features/confirmedMenu | Firestore (users/{uid}/confirmedMenuItems), features/character | Firebase SDK直接 |
| features/character | Firestore (characterDialogues), AuthContext (isPremium) | Firebase SDK直接 |
| features/settings | Firestore (users/{uid}), AuthContext | Firebase SDK直接 |
| CF-01 (analyzeRecipeImage) | Claude API, Firebase Secret Manager | HTTPS |
| CF-02 (suggestMeals) | Firestore (users/{uid}/recipes, confirmedMenuItems) | Admin SDK |
| CF-03 (spinGacha) | Firestore (users/{uid}/recipes, confirmedMenuItems, gachaConfig) | Admin SDK |

---

## データフロー図

### 料理登録フロー
```
[ユーザー] → [RecipeForm] → [Cloud Storage] (画像アップロード)
                          → [CF-01] → [Claude API] (画像認識)
                          → [Firestore: users/{uid}/recipes] (レシピ保存)
                          → [useCharacterDialogue] → [Firestore: characterDialogues] (一言取得)
                          → [CharacterBottomSheet] (表示)
```

### 献立提案フロー
```
[ユーザー] → [SelectionPage]
              ├─ レパートリー10件未満 → ガチャ誘導（useCharacterDialogue でインライン表示）
              └─ 10件以上 → [FilteringPage]
                             → [CF-02: suggestMeals]
                                ├─ Firestore: users/{uid}/recipes (取得)
                                ├─ Firestore: users/{uid}/confirmedMenuItems (除外)
                                └─ フィルタリング + ランダム3品選択
                             → [SuggestionResult] (3品表示)
                             → 「これにする！」
                             → [Firestore: users/{uid}/confirmedMenuItems] (確定書き込み)
                             → [useCharacterDialogue] → [CharacterBottomSheet]
```

### ガチャフロー
```
[ユーザー] → [GachaPage] → 「ガチャを回す！」
              → [CF-03: spinGacha]
                 ├─ Firestore: users/{uid}/recipes (取得)
                 ├─ Firestore: users/{uid}/confirmedMenuItems (除外)
                 ├─ Firestore: gachaConfig (確率取得)
                 └─ レアリティ抽選 + レシピ選択
              → [GachaSpinner] (演出再生)
              → [GachaResult] (結果表示)
              ├─ 「これにする！」
              │   → [Firestore: users/{uid}/confirmedMenuItems] (確定書き込み)
              │   → [useCharacterDialogue] → [CharacterBottomSheet]
              └─ 「もう一度」(リセマラ)
                  ├─ 1〜4回目 → CF-03 再呼び出し
                  └─ 5回目 → [RerollLimitScreen] (メシストフェレス固定)
```

### 「つくったよ！」フロー
```
[ユーザー] → 「✅ つくったよ！」
              → [useCharacterDialogue] (trigger=meal_completed)
              → [CharacterBottomSheet] (褒めトーン)
              → ボトムシート閉じる
              → [Firestore: users/{uid}/confirmedMenuItems/{itemId}] (削除)
              → 件数で画面遷移分岐
```

---

## Firestoreコレクション間の参照関係

```
users/{uid}                          (ルートドキュメント)
    │
    ├── recipes/{recipeId}           (料理レパートリー)
    │       ↑
    │       │ recipeId で参照
    │       │
    └── confirmedMenuItems/{itemId}  (確定済み献立)
            │ recipeId フィールドで recipes を参照
            │ (非正規化: recipeName, rarity, difficulty, duration をコピー保持)

characterDialogues/{dialogueId}      (マスターデータ・全ユーザー共有)
    │ characterId, trigger, tone で検索

gachaConfig/{configId}               (マスターデータ・管理者設定)
    │ rarity で検索
```

### 非正規化の方針
- **confirmedMenuItems**: レシピの基本情報（recipeName, rarity, difficulty, duration）をコピー保持
  - **理由**: 献立リスト表示時にrecipesサブコレクションへの追加読み取りを避ける（コスト最適化）
  - **整合性**: レシピ編集時にconfirmedMenuItemsは更新しない（確定時点のスナップショット）

---

## 共有コンポーネントの利用箇所

### CharacterBottomSheet
| 利用箇所 | trigger | from |
|---|---|---|
| features/onboarding | recipe_registered | onboarding |
| features/recipe | recipe_registered | registration |
| features/suggestion | meal_decided | suggestion |
| features/gacha | gacha_decided | gacha / gacha_10 |
| features/confirmedMenu | meal_completed | detail / list |

### CharacterInline
| 利用箇所 | trigger | from |
|---|---|---|
| features/suggestion (FilteringPage) | meal_suggested | filtering |

---

## セキュリティ境界

```
+--------------------------------------------------+
|  フロントエンド（ブラウザ）                         |
|  ┌──────────────────────────────────────────────┐ |
|  │ Firebase Auth Token                          │ |
|  │ → Firestore Security Rules で認可            │ |
|  │ → Cloud Functions Callable で自動検証        │ |
|  └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
                    │
                    │ HTTPS (TLS 1.2+)
                    │
+--------------------------------------------------+
|  Firebase Backend                                 |
|  ┌──────────────────────────────────────────────┐ |
|  │ Firestore Security Rules                     │ |
|  │ → ユーザーは自分のサブコレクションのみアクセス可│ |
|  │ → マスターデータは読み取り専用                 │ |
|  │ → 管理者のみマスターデータ書き込み可           │ |
|  └──────────────────────────────────────────────┘ |
|  ┌──────────────────────────────────────────────┐ |
|  │ Cloud Functions                              │ |
|  │ → request.auth.uid で認証確認                │ |
|  │ → Admin SDK でFirestore操作（Security Rules  │ |
|  │   をバイパス）                                │ |
|  │ → Secret Manager でAPIキー管理               │ |
|  └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
```
