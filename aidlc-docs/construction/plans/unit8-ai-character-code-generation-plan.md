# Unit 8: AIキャラクター — Code Generation 計画

> 設計4ステージはスキップし、Code Generationのみ実行。
> 理由: キャラIF型（`CharacterDialogueQuery` / `UseCharacterDialogue` / `CharacterLine` / `CharacterBottomSheetProps` / `CharacterInlineProps`）はUnit 3で確定。台詞マスター（`characterDialogues`・50件）はUnit 2で投入済み。trigger×tone×キャラの組み合わせは Application Design（services.md）で確定。設定画面の仕様は ux-design.md で確定。Security Rules（`characterDialogues` 読み取り専用・`users/{uid}` の favoriteCharacters 更新可）はUnit 1で定義済み。新規データモデル/NFR/インフラなし。

## ユニットコンテキスト
- **対象**: Unit 8（AIキャラクター）= `features/character`（正式実装へ差し替え）+ `features/settings`（新規）
- **配置**: `apps/web/src/features/character`, `apps/web/src/features/settings`
- **対応ストーリー**: US-13（献立確定時の一言・主担当）, US-14（料理登録時の一言・主担当）, US-15（推しキャラ固定・主担当）, US-18（設定画面からのログアウト導線）, US-00/01/05/06/10/11/12/16（各triggerの一言提供）
- **対応FR**: FR-03（今日の一言）, FR-06（依存度向上・プレミアム）
- **依存（既存資産）**:
  - 型: `@shared/types` の `CharacterId` / `CharacterLine` / `Tone` / `Trigger` / `From` / `UserProfile`、`@/shared/types` の `CharacterDialogueQuery` / `UseCharacterDialogue` / `CharacterBottomSheetProps` / `CharacterInlineProps`
  - マスター: Firestore `characterDialogues`（Unit 2投入・`{ characterId, trigger, tone, message, isPremium }`・全50件／無料36・プレミアム14）
  - プリミティブ: `shared/hooks/useCollection`（`getCollectionOnce`）, `shared/hooks/useDocument`（`updateDocument`）
  - 認証/プロフィール: `AuthProvider`（`profile.isPremium` / `profile.favoriteCharacters` / `refreshProfile`）, `useAuth`（`signOut`）
  - UI: `shared/components/ui`（Button・Card・Modal・BottomSheet・LoadingSpinner）
  - Rules: `firestore.rules`（`characterDialogues` は認証ユーザー読み取り可・`users/{uid}` 更新で favoriteCharacters 変更可）
- **差し替え対象（スタブ）**:
  - `features/character/hooks/useCharacterDialogue.ts`（trigger別固定文言 → マスター参照＋キャラ/トーン選択＋isPremium/推しキャラ絞り込み）
  - `features/character/components/CharacterBottomSheet.tsx` / `CharacterInline.tsx`（🍙絵文字 → キャラ別ビジュアル）
  - `app/routes.tsx` の `SettingsPlaceholder` → `SettingsPage`
- **呼び出し元（変更不要で機能する想定）**: Unit 5（recipe_registered）, Unit 6（meal_decided / meal_completed / meal_suggested）, Unit 7（gacha_decided / gacha_reroll_limit）

## ステージ要否評価（拡張準拠）
| ステージ | 判定 | 理由 |
|---|---|---|
| Functional Design | SKIP | キャラIF型・台詞スキーマ・trigger×tone対応表が確定済み。新規データモデルなし（`CharacterDialogue` 型の追記のみ） |
| NFR Requirements | SKIP | 新規NFRなし（Firestore読み取り最小化はUnit 1のPERF方針を踏襲） |
| NFR Design | SKIP | 連動 |
| Infrastructure Design | SKIP | Firestore/Hosting はUnit 1で定義済み。新規インフラなし |
| Code Generation | EXECUTE | 常に実行 |

- **Security Baseline**: 台詞マスターは読み取り専用（Rules済）。`favoriteCharacters` 更新は `users/{uid}`（本人のみ・`isPremium`/`createdAt` は不変・Rules済）。**プレミアム判定はクライアント表示制御のみ**であり、`isPremium` 自体はクライアントから改変不可（Rules で保証）＝権限昇格リスクなし。プレミアム台詞はマスター読み取り自体が全ユーザーに許可されているため「機密」ではなく「表示上の出し分け」である点を code-summary に明記する。
- **PBT（Partial適用）**: トーン決定・候補フィルタ・ランダム選択は純粋関数に切り出せるためPBT候補。ただし現状 `fast-check` は未導入（依存追加が必要）→ Question 6 で扱う。

---

## 質問

### Question 1: 台詞マスターの取得・キャッシュ方式（重要）

`characterDialogues` は50件の静的マスター。現行IF `getDialogue(query) => CharacterLine | null` は**同期関数**のため、呼び出し時に都度クエリする設計は取れない（IF変更＝Unit 5/6/7の呼び出し元改修が必要になる）。

A) **起動時に一括取得してキャッシュ**（推奨）: 既存の `MasterDataProvider` と同じ思想で、`CharacterDialogueProvider`（新規・`app/providers`）がアプリ起動時に `getCollectionOnce<CharacterDialogue>("characterDialogues")` を1回実行し Context で配布。`useCharacterDialogue` はキャッシュから同期的に選択 → IF変更なし・Firestore読み取りはセッション1回のみ（無料枠に優しい）
B) 既存の `MasterDataProvider` に統合（difficulty/rarity と同じ Provider で3コレクション取得）— Provider数は増えないが、マスターデータProviderの責務が広がる
C) trigger発火ごとに `where` クエリ（IFを非同期化し、Unit 5/6/7の呼び出し元も改修）
D) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 2: キャラクタービジュアルの表現（画像アセット未提供）

`apps/web/src/assets/characters/` は未作成で、7キャラの画像アセットは未提供。ux-design では「キャラクター画像 + 名前 + セリフ」。

A) **キャラ別プロフィール定義 + 絵文字/テーマカラーのプレースホルダ**（推奨）: `features/character/characterProfiles.ts` に7キャラの `{ name, emoji, themeColor, imagePath }` を定義。画像は `imagePath` があれば `<img>`、無ければ絵文字にフォールバック → 後から画像を置くだけで差し替え完了
B) 現状の統一絵文字（🍙）のまま名前だけ表示（最小変更）
C) Other (please describe after [Answer]: tag below)

[Answer]:一旦画像はこのあと連携するので、待ってて。特徴は過去のものをベースに作成してください。

### Question 3: 推しキャラ絞り込みで候補0件になった場合のフォールバック（FR-06）

プレミアムユーザーが推しキャラを固定すると、trigger によっては「推しキャラ × その trigger」の台詞が存在しないケースが起こる（例: メシストフェレスは `gacha_reroll_limit` のみ。シェフレイはプレミアム台詞2件のみ）。

A) **段階的フォールバック**（推奨）: ①推しキャラ∩trigger → ②（0件なら）trigger の全候補 → ③（0件なら）null（非表示）。`gacha_reroll_limit` は仕様通りメシストフェレス固定を優先
B) 推しキャラで0件なら一言を表示しない（null）
C) Other (please describe after [Answer]: tag below)

[Answer]:一旦作成をお願いします。全キャラコメントありきで、条件合致しない場合はフォールバックでOKです。

### Question 4: 推しキャラ選択画面の配置（US-15）

ux-design: 設定画面 →（isPremium=true時）「✏️ キャラを選ぶ」→ キャラクター選択画面 → 保存。

A) **別ルート `/settings/characters`**（推奨）: ボトムナビなしの単独ルート（レシピのサブ画面と同じ流儀）。7キャラのカード一覧を複数選択（チェック）→「保存する」で `favoriteCharacters` 更新 →`refreshProfile()` 後に設定画面へ戻る
B) 設定画面内のモーダル（`shared/ui/Modal`）で選択・保存
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 5: 設定画面の実装範囲（US-18 / FR-06）と一言の見せ方

(5a) 設定画面は ux-design 準拠で「ニックネーム表示（やあ、〇〇！）／推しキャラ設定カード（isPremium=false → 🔒 アンロックする[将来の課金導線・押下時は「準備中」メッセージ表示のみ]、isPremium=true → ✏️ キャラを選ぶ）／ログアウト（確認ダイアログ → `/login`）」の3要素でよいか。

(5b) 一言表示は既存の呼び出し元（Unit 5/6/7）を**変更せず**、`useCharacterDialogue` とコンポーネント内部の差し替えのみで完結させる方針でよいか（ボトムシート5秒自動クローズ・インライン表示は現行踏襲）。

A) **両方OK**（推奨）
B) 5aの一部を変更（[Answer]に記載）
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 6: テスト方針（PBT）と firestore.rules のサブコレクション未追記の扱い

(6a) 台詞選択ロジック（トーン決定・候補フィルタ・ランダム選択）のテスト方式:

A) **通常のユニットテストで境界を網羅**（推奨・ハッカソンスコープ）: 全 trigger × isPremium × 推しキャラ有無の組み合わせを表形式で検証。ランダム選択は `Math.random` をモックして決定的に検証
B) `fast-check` を web に導入してPBT（純粋関数のプロパティ検証）を追加
C) Other

(6b) `firestore.rules` に `users/{uid}/recipes` と `users/{uid}/confirmedMenuItems` のルールが**未追記**（コメントのみ）で、デフォルト拒否によりレシピ/確定献立の読み書きが本番では拒否される状態です（Unit 5/6での追記漏れ・`tests/rules` の失敗要因の一つ）。

A) **本ユニットで補完する**（推奨）: 本人のみ read/write を許可するルールを追記（Unit 8の副次修正として code-summary に明記）
B) Build & Test フェーズでまとめて対応（今回は触らない）
C) Other (please describe after [Answer]: tag below)

[Answer]:aについては、代表ケースでいいよ。全部は重たい。bは補完をお願い。

---

## 実行ステップ（回答確定後に確定・仮）

- [x] Step 1: 型追記 — `apps/shared/types/index.ts` に `CharacterDialogue`（`{ characterId, trigger, tone, message, isPremium }`）を追加し、`apps/web/src/shared/types` から再エクスポート
- [x] Step 2: `features/character/characterProfiles.ts` + `characterImages.ts`（Q2・7キャラの名前/肩書き/絵文字/テーマカラー/紹介文＋内蔵フォールバック台詞。`assets/{キャラ名}/` の画像31枚を結線し代表画像を自動注入・`CHARACTER_NAME` は互換維持）
- [x] Step 3: `features/character/dialogueSelector.ts`（純粋関数: trigger→tone候補決定・isPremium/推しキャラ絞り込み・段階的フォールバック[Q3]・ランダム選択）
- [x] Step 4: `app/providers/CharacterDialogueProvider.tsx`（Q1・起動時に台詞マスターを1回取得しContext配布）+ `AppProvider` へ組み込み
- [x] Step 5: `features/character/hooks/useCharacterDialogue.ts` をスタブから正式実装へ差し替え（Provider参照 + AuthContextから isPremium/favoriteCharacters 自動取得 + dialogueSelector 呼び出し）
- [x] Step 6: `features/character/components/CharacterAvatar.tsx`（新規・circle/portrait・variant対応）+ `CharacterBottomSheet.tsx` / `CharacterInline.tsx` をキャラ別立ち絵に更新（Q2・data-testid維持）+ `RerollLimitScreen` の立ち絵化
- [x] Step 7: `features/settings/hooks/useSettings.ts`（`updateFavoriteCharacters` / プロフィール参照・`updateDocument` + `refreshProfile`）
- [x] Step 8: `features/settings/components/PremiumSettings.tsx`（Q5a・推しキャラ設定カード・isPremium分岐）
- [x] Step 9: `features/settings/pages/SettingsPage.tsx`（ニックネーム・PremiumSettings・ログアウト確認ダイアログ）
- [x] Step 10: `features/settings/pages/CharacterSelectPage.tsx`（Q4・7キャラ選択・保存）
- [x] Step 11: ルーティング結線（`/settings` を `SettingsPage` に差し替え・`/settings/characters` 追加）
- [x] Step 12: `firestore.rules` のサブコレクション補完（Q6b=A・recipes / confirmedMenuItems に本人スコープの read/write を追記）
- [x] Step 13: テスト（Q6a）— dialogueSelector（trigger×tone×isPremium×推しキャラ・フォールバック）・useCharacterDialogue・useSettings・SettingsPage/CharacterSelectPage の軽い描画
- [x] Step 14: ドキュメント（`aidlc-docs/construction/unit8-ai-character/code/code-summary.md`）
- [x] Step 15: 整合性確認（typecheck/build・全テスト実行・get_diagnostics・FSD準拠）

---

*質問に回答したら「回答しました」とお知らせください。推奨でよければ「すべてAで進めて」でOKです。*
