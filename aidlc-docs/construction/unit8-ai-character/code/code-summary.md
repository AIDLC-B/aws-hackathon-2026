# Unit 8: AIキャラクター — Code 生成サマリー

> 本書はドキュメント（マークダウン）。実コードは `apps/web/src/features/character`・`apps/web/src/features/settings`・`apps/web/src/app/providers` 配下に配置。
> 対応ストーリー: US-13（献立確定時の一言）/ US-14（料理登録時の一言）/ US-15（推しキャラ固定）/ US-18（設定からのログアウト）/ US-00・01・05・06・10・11・12・16（各triggerの一言提供）
> 対応FR: FR-03（今日の一言）/ FR-06（依存度向上・プレミアム）

## 概要
Unit 5〜7 でスタブだったキャラクター一言を正式実装に差し替え、設定画面（推しキャラ固定・ログアウト導線）を新規実装した。
台詞は Firestore の `characterDialogues`（Unit 2 が投入・50件）を起動時に一度だけ取得してキャッシュし、
trigger からトーン候補を決め、isPremium・推しキャラで絞り込んだ候補からランダムに1件を選ぶ。
7キャラクターの画像（`apps/web/src/assets/{キャラ名}/`・計31枚）を結線し、絵文字プレースホルダから立ち絵表示へ移行した。

呼び出し元（Unit 5/6/7）は**一切変更していない**。`useCharacterDialogue` の同期IFを維持したため、
`CharacterBottomSheet` / `CharacterInline` / `RerollLimitScreen` はそのまま正式な台詞・ビジュアルで動作する。

## 設計上の決定（Q1〜Q6）
| 質問 | 決定 | 内容 |
|---|---|---|
| Q1 | A | 台詞マスターは `CharacterDialogueProvider` が起動時に1回だけ `getCollectionOnce` で取得しContextでキャッシュ。`getDialogue` の同期IFを維持でき、Firestore読み取りはセッション1回のみ |
| Q2 | 画像連携 | 当初はプレースホルダ方針だったが、セッション中に画像が `apps/web/src/assets/{キャラ名}/` へ配置されたため `characterImages.ts` で結線。画像が解決できない場合は絵文字＋テーマカラーにフォールバック |
| Q3 | A+ | 段階的フォールバック（推し∩trigger → trigger全体 → 内蔵台詞）。さらに「全キャラが喋れる」状態を保証するため 7キャラ × 6trigger の内蔵台詞を `characterProfiles` に定義 |
| Q4 | A | 推しキャラ選択は別ルート `/settings/characters`（ボトムナビなし・保存で設定画面へ戻る） |
| Q5 | A | 設定画面は ux-design 準拠の3要素（ニックネーム挨拶／推しキャラ設定カード／ログアウト確認ダイアログ）。呼び出し元は無変更 |
| Q6 | a=代表ケース / b=補完 | テストは分岐ごとの代表ケースに限定（網羅なし・`Math.random` 制御で決定的）。`firestore.rules` の `recipes` / `confirmedMenuItems` ルールを補完 |

## 生成・変更ファイル

### 型（変更）
- **変更** `apps/shared/types/index.ts` — `CharacterDialogue`（`{ characterId, trigger, tone, message, isPremium }`）を追加
- **変更** `apps/web/src/shared/types/index.ts` — `CharacterDialogue` を再エクスポート

### features/character（新規・差し替え）
- **新規** `characterImages.ts` — `apps/web/src/assets/{キャラ名}/` の画像31枚を Vite asset import で解決。`CHARACTER_IMAGES`（キャラ別配列）と `getCharacterImage(id, variant)`（枚数超過は循環）
- **新規** `characterProfiles.ts` — 7キャラの表示属性（名前・肩書き・絵文字・テーマカラー・紹介文）＋**7キャラ × 6trigger の内蔵フォールバック台詞**。画像は `CHARACTER_IMAGES` から自動注入（代表=1枚目）。`CHARACTER_NAME` / `CHARACTER_ORDER` / `getCharacterProfile` を提供
- **新規** `dialogueSelector.ts` — 純粋関数の選択ロジック。`TRIGGER_TONES`（services.md の trigger×tone 定義）・`FIXED_CHARACTER`（gacha_reroll_limit=メシストフェレス固定）・`TRIGGER_FALLBACK_CHARACTERS`・`selectDialogue()`
- **新規** `components/CharacterAvatar.tsx` — キャラビジュアル共通化。`shape="circle"|"portrait"`・`variant` 指定に対応。縦横比が異なる立ち絵を切り取らないよう `objectFit: contain`
- **差し替え** `hooks/useCharacterDialogue.ts` — スタブ（trigger別固定文言）→ 正式実装（Providerキャッシュ参照 + AuthContextから isPremium/favoriteCharacters 自動取得 + `selectDialogue` 委譲）。`CHARACTER_NAME` は互換のため再エクスポート
- **差し替え** `components/CharacterBottomSheet.tsx` — 立ち絵（portrait 110px）＋キャラ名＋肩書き＋テーマカラー。`data-testid="character-bottom-sheet"` を追加
- **差し替え** `components/CharacterInline.tsx` — 立ち絵（portrait 48px）＋キャラ別配色

### app/providers（新規・変更）
- **新規** `CharacterDialogueProvider.tsx` — 認証完了後に `characterDialogues` を1回取得しContextで配布。取得失敗・Provider外は0件扱い（内蔵フォールバックで表示継続）
- **変更** `AppProvider.tsx` — `MasterDataProvider` の内側に `CharacterDialogueProvider` を追加

### features/settings（新規）
- **新規** `hooks/useSettings.ts` — `profile` / `isPremium` / `favoriteCharacters` 参照 + `updateFavoriteCharacters`（`updateDocument("users/{uid}")` → `refreshProfile()`）
- **新規** `components/PremiumSettings.tsx` — 推しキャラ設定カード。isPremium=false → 「🔒 アンロックする」（押下で準備中の案内表示）／isPremium=true → 「✏️ キャラを選ぶ」＋現在の推しキャラプレビュー
- **新規** `pages/SettingsPage.tsx` — ニックネーム挨拶・PremiumSettings・ログアウト（確認Modal → `signOut`。ガードが `/login` へリダイレクト）
- **新規** `pages/CharacterSelectPage.tsx` — 7キャラのカード一覧（複数選択・キーボード操作対応・`role="checkbox"`）→ 保存で `favoriteCharacters` 更新 → `/settings` へ

### 横断（変更）
- **変更** `app/routes.tsx` — `/settings` を `SettingsPlaceholder` から `SettingsPage` に差し替え、`/settings/characters` を追加（ボトムナビなし）
- **変更** `features/gacha/components/RerollLimitScreen.tsx` — メシストフェレスを立ち絵（portrait 200px）で表示。名前取得を `getCharacterProfile` に統一
- **変更** `firestore.rules` — **Unit 5/6 の追記漏れを補完**（Q6b）。`users/{uid}/recipes/{recipeId}` と `users/{uid}/confirmedMenuItems/{itemId}` に本人のみ read/write を許可。従来はデフォルト拒否に落ちており、本番でレパートリー・確定献立の読み書きが拒否される状態だった

### テスト（新規・変更・tests/unit）
- **新規** `dialogueSelector.test.ts` — 非プレミアムはプレミアム台詞を出さない／プレミアムは含む／推しキャラ限定／推しキャラに台詞が無い場合のフォールバック／gacha_reroll_limit のメシストフェレス固定／マスター0件時の内蔵フォールバック／全キャラ×全triggerの内蔵台詞とトーン整合
- **新規** `useCharacterDialogue.test.tsx` — マスターからの選択／AuthContextの isPremium・favoriteCharacters 自動適用／Provider外でのフォールバック
- **新規** `useSettings.test.tsx` — profile参照／`users/{uid}` 更新と `refreshProfile` 呼び出し／Provider外エラー
- **新規** `SettingsPage.test.tsx` — ニックネーム挨拶／isPremium=false のアンロック案内／isPremium=true の選択画面遷移／ログアウトの確認ダイアログ経由
- **新規** `CharacterSelectPage.test.tsx` — 7キャラ表示と既存選択の反映／トグル→保存→遷移
- **変更** `CharacterInline.test.tsx` — 固定文言前提から「キャラクターが一言を発する」検証へ更新（`Math.random` を固定して決定的に）

## 一言の選択ロジック（実装仕様）
```
1. trigger で絞り込み
2. isPremium=false のユーザーは isPremium=false の台詞のみ
3. trigger 固定キャラ（gacha_reroll_limit=メシストフェレス）があればそのキャラに限定（推し設定より優先）
4. プレミアム かつ 推しキャラ設定あり → 推しキャラに限定（0件なら絞り込み解除）
5. trigger 対応トーン（services.md）で絞り込み（0件なら解除）
6. 候補からランダム1件
7. 候補0件 → characterProfiles の内蔵フォールバック台詞（固定キャラ→推しキャラ→trigger対応キャラの順で選定）
```

## セキュリティ整合
- 台詞マスターは認証ユーザーの読み取り専用（Rules済）。プレミアム台詞も読み取り自体は全ユーザーに許可されるため、`isPremium` による出し分けは**機密保護ではなく表示制御**である
- `isPremium` / `createdAt` はSecurity Rulesでクライアント変更不可（SEC-2）。本ユニットが更新するのは `favoriteCharacters` のみで、権限昇格の経路は増えていない
- 追加した `recipes` / `confirmedMenuItems` のルールは `request.auth.uid == uid` の本人スコープに限定（SEC-1準拠）

## 検証結果
- `npm run typecheck`（web + functions）: 成功
- `npm run build`（web）: 成功（画像31枚がハッシュ付きアセットとして出力）
- `npx vitest run --exclude tests/rules`: 23ファイル **102 passed**
  - 既知の失敗: `tests/rules/firestore.rules.test.ts`（Firebaseエミュレータ前提の統合テスト・環境依存）
- `npm run lint`: 本ユニット由来の指摘なし（既知: `shared/hooks/useCollection.ts:72` の `react-hooks/exhaustive-deps` ルール未定義エラー・Unit 3由来）
- `get_diagnostics`（新規/変更13ファイル）: クリーン

## 申し送り・改善余地
- **画像サイズ**: 各PNGが250〜300KB（計約7MB）。表示されるのは代表画像のみだが、WebP変換・リサイズ（表示は最大200px）で転送量を大幅削減できる
- **表情バリエーション**: `CharacterAvatar` の `variant` で2枚目以降を使える。トーン別に表情を切り替える拡張が可能（例: praise=笑顔、scolding=煽り顔）
- **台詞の拡充**: `characterDialogues` は現在50件（無料36/プレミアム14）。シェフレイはプレミアム台詞のみのため、非プレミアム時は内蔵フォールバックが使われる。Claude APIでの大量生成はUnit 2のTODO
- **プレミアム解放**: 「🔒 アンロックする」は案内表示のみ（FR-06のMVP方針どおり管理者がFirestoreで `isPremium` を操作）
- **`tests/rules`**: 補完したサブコレクションのルール検証は Build & Test フェーズ（エミュレータ起動）で実施する
