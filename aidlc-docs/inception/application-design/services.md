# サービス層設計

## アーキテクチャ概要

```
+------------------+     +-------------------+     +------------------+
|  React Frontend  | --> | Cloud Functions   | --> | Claude API       |
|  (Firebase SDK)  |     | (CF-01/02/03)     |     | (Anthropic)      |
+------------------+     +-------------------+     +------------------+
        |                         |
        v                         v
+------------------+     +-------------------+
|  Firestore       |     | Cloud Storage     |
|  (直接アクセス)   |     | (料理写真)        |
+------------------+     +-------------------+
        |
        v
+------------------+
| Firebase Auth    |
| (認証・認可)      |
+------------------+
```

---

## ドメイン間通信パターン

### パターン1: フロントエンド → Firestore 直接操作
- **対象**: レシピCRUD、確定済み献立CRUD、ユーザープロフィール、設定
- **認可**: Firestore Security Rules で制御
- **特徴**: Cloud Functionsを経由しないため、呼び出し回数を消費しない

### パターン2: フロントエンド → Cloud Functions → Firestore
- **対象**: 献立提案（CF-02）、ガチャ抽選（CF-03）
- **理由**: ビジネスロジック（フィルタリング・確率計算）をサーバーサイドで実行
- **認可**: Callable Functions は Firebase Auth トークンを自動検証

### パターン3: フロントエンド → Cloud Functions → 外部API
- **対象**: 料理写真認識（CF-01 → Claude API）
- **理由**: APIキーの保護
- **認可**: Callable Functions + Secret Manager

---

## Firestoreデータフロー

### 料理登録フロー
```
1. ユーザーが写真を撮影/選択
2. Cloud Storage に画像アップロード（フロントエンドから直接）
3. CF-01 (analyzeRecipeImage) を呼び出し → Claude API で認識
4. 認識結果をフロントエンドに返却
5. ユーザーが確認・修正
6. フロントエンドから Firestore に直接書き込み
   → users/{uid}/recipes/{recipeId}
```

### 献立提案フロー
```
1. ユーザーがフィルタリング条件を選択
2. CF-02 (suggestMeals) を呼び出し
3. CF-02 内部:
   a. users/{uid}/recipes を取得
   b. users/{uid}/confirmedMenuItems を取得（除外用）
   c. フィルタリング実行
   d. ランダム3品選択
4. 結果をフロントエンドに返却
5. ユーザーが「これにする！」で確定
6. フロントエンドから Firestore に直接書き込み
   → users/{uid}/confirmedMenuItems/{itemId}
```

### ガチャフロー
```
1. ユーザーが「ガチャを回す！」を押す
2. CF-03 (spinGacha) を呼び出し（count: 1 or 10）
3. CF-03 内部:
   a. users/{uid}/recipes を取得
   b. users/{uid}/confirmedMenuItems を取得（除外用）
   c. gachaConfig から確率設定を取得
   d. レアリティ抽選実行
   e. 該当レアリティのレシピからランダム選択
4. 結果をフロントエンドに返却
5. ガチャ演出を再生
6. ユーザーが「これにする！」で確定
7. フロントエンドから Firestore に直接書き込み
   → users/{uid}/confirmedMenuItems/{itemId}（1件 or 10件）
```

### キャラクター台詞取得フロー
```
1. trigger発火（献立確定・料理登録・つくったよ等）
2. useCharacterDialogue フック内:
   a. characterDialogues コレクションから該当trigger・toneの台詞を取得
   b. isPremium=false の台詞のみ（プレミアムユーザーは全台詞対象）
   c. favoriteCharacters が設定されている場合はそのキャラクターのみ
   d. ランダムで1件選択
3. ボトムシート or インラインで表示
```

---

## Cloud Functions 呼び出しフロー

### 認証フロー
```
フロントエンド                    Cloud Functions
    |                                |
    |-- httpsCallable("CF名") ----->|
    |   (Firebase Auth Token 自動付与) |
    |                                |-- request.auth.uid で認証確認
    |                                |-- Firestore操作（Admin SDK）
    |                                |
    |<-- レスポンス ------------------|
```

### エラーハンドリング
- **認証エラー**: `functions.https.HttpsError("unauthenticated")`
- **バリデーションエラー**: `functions.https.HttpsError("invalid-argument")`
- **内部エラー**: `functions.https.HttpsError("internal")`
- **レシピ不足**: `functions.https.HttpsError("failed-precondition")`

---

## キャラクタードメインIF設計

### インターフェース
```typescript
interface CharacterDialogueRequest {
  trigger: TriggerType;
  from: FromType;
}

type TriggerType = 
  | "meal_decided"
  | "gacha_decided"
  | "meal_completed"
  | "recipe_registered"
  | "meal_suggested"
  | "gacha_reroll_limit";

type FromType =
  | "suggestion"
  | "gacha"
  | "gacha_10"
  | "detail"
  | "list"
  | "registration"
  | "onboarding"
  | "filtering";
```

### 内部ロジック（フロントエンド内で実行）
1. `trigger` と `from` から適切な `tone` を決定（組み合わせ定義表に基づく）
2. `isPremium` と `favoriteCharacters` をAuthContextから取得
3. Firestoreの `characterDialogues` コレクションからクエリ
4. 条件に合致する台詞群からランダムで1件選択
5. キャラクター情報（画像パス・名前）と台詞を返却

### trigger × tone 組み合わせ定義

| trigger | tone | 対応キャラクター |
|---|---|---|
| meal_decided | praise, empathy | サボ母ちゃん, サボわらし, ニャマケ, サボット |
| gacha_decided | encouragement, praise | サボエル, サボ母ちゃん, サボわらし |
| meal_completed | praise, encouragement | サボ母ちゃん, サボわらし, サボエル |
| recipe_registered | praise, encouragement | サボ母ちゃん, サボわらし, サボエル |
| meal_suggested | empathy, encouragement | ニャマケ, サボット, サボエル, サボ母ちゃん |
| gacha_reroll_limit | scolding (固定) | メシストフェレス（固定） |

### マスターデータ戦略
- **事前生成**: Claude APIを使って各trigger × tone × characterの組み合わせで複数パターンの台詞を生成
- **Firestoreに格納**: `characterDialogues` コレクションにマスターデータとして保存
- **実行時のAPI呼び出しなし**: フロントエンドからFirestoreを直接読み取り（Cloud Functions不要）
- **コスト**: Firestore読み取りのみ（Claude API呼び出しは事前生成時のみ）
