# Unit 7: 献立ガチャ — Code 生成サマリー

> 本書はドキュメント（マークダウン）。実コードは `apps/web/src/features/gacha` 配下に配置。
> 対応ストーリー: US-10（シングルガチャ）/ US-11（リセマラ→堕落ルート）/ US-12（10連ガチャ・追加/入れ替え）

## 概要
献立ガチャ機能を実装した。CF-03（spinGacha）で抽選し、カプセルトイ演出を経て結果を表示、選んだ献立を確定済み献立に保存する。
シングル（1連）／10連に対応し、リセマラ（もう一度）を5回繰り返すと堕落ルート（メシストフェレス登場＋デリバリー誘導）へ分岐する。
10連は既存献立がある場合に「追加／入れ替え」を選択できる。

## 設計上の決定（Q1〜Q5）
| 質問 | 決定 | 内容 |
|---|---|---|
| Q1 | A | リセマラカウントは `sessionStorage` で管理（画面遷移・リロードを跨いで保持、タブ/PWAを閉じると消える＝「セッション」の語義） |
| Q2 | A | デリバリー誘導は `features/gacha/config.ts` の `DELIVERY_URL`（プレースホルダ）。新規タブで開く |
| Q3 | A | CSSベースのカプセルトイ簡易演出（回転＋落下バウンド）。画像差し替え可能な構造 |
| Q4 | A | `useConfirmedMenu.clearAll` 追加 + `confirmGachaResult({mode})` で add/replace 両対応。既存0件は即追加、1件以上は選択ダイアログ |
| Q5 | A | `/gacha` を `GachaPage` 実体化。確定後は HomePage の件数分岐に委譲。テストはロジック中心+軽い描画 |

## 生成・変更ファイル

### features/confirmedMenu（変更）
- **変更** `hooks/useConfirmedMenu.ts` — `clearAll`（全件remove反復）を追加（Q4・10連入れ替え用）

### features/gacha（新規）
- **新規** `config.ts` — `REROLL_LIMIT`（5）・`DELIVERY_URL`（プレースホルダ）・`DELIVERY_LABEL`
- **新規** `hooks/useGacha.ts` — CF-03（spinGacha）呼び出し・`spin`/`reroll`（sessionStorageカウント・5回目で堕落判定・boolean返却）/`backToResult`/`resetReroll`/`confirmGachaResult`（add=追加 / replace=clearAll後に追加・source=gacha/gacha_10・確定後カウント0リセット）
- **新規** `components/GachaSpinner.tsx` — カプセルトイ演出（CSSアニメ・1連/10連・絵文字プレースホルダ）
- **新規** `components/GachaResult.tsx` — 結果表示（レアリティN/R/SR/SSRバッジ・料理名・頻度・難易度・所要時間・1件/10連一覧）・これにする！/もう一度
- **新規** `components/RerollLimitScreen.tsx` — 堕落ルート（US-11・メシストフェレス固定・デリバリー誘導[Q2]・やっぱり作る）
- **新規** `pages/GachaPage.tsx` — フェーズ管理（idle→spinning→result/reroll_limit）・シングル/10連・確定モードダイアログ（Q4）・gacha_decided ボトムシート→ホーム遷移

### app（変更）
- **変更** `app/routes.tsx` — `/gacha` を GachaPlaceholder から `GachaPage` に差し替え

### テスト（新規・tests/unit）
- **新規** `useGacha.test.ts` — spin(1/10)/リセマラ遷移（1〜4=false・5回目=true・sessionStorage復元）/backToResult/confirmGachaResult（add・10連add・replace・カウントリセット）
- **新規** `GachaResult.test.tsx` — レアリティ/料理名描画・コールバック・10連見出し
- **新規** `RerollLimitScreen.test.tsx` — メシストフェレス一言・デリバリーリンク（href/target）・やっぱり作る
- **新規** `GachaPage.test.tsx` — 初期ボタン・10連×既存ありでモードダイアログ→replace・既存0件はダイアログなしでadd
- **変更** `useConfirmedMenu.test.ts` — `clearAll` の全件remove検証を追加

## 確定後のフロー（US-13連携）
- 確定 → `gacha_decided` ボトムシート（from=シングル:`gacha` / 10連:`gacha_10`）→ 閉じたら `/` へ
- HomePage（Unit 6）が件数分岐: 1件→確定献立詳細 / 2件以上→献立リスト（10連は10件→リスト）

## 検証結果
- `npm run typecheck`（web + functions）: 成功
- `npm run build`（web）: 成功
- `npx vitest run --exclude tests/rules`: 18ファイル 83 passed
  - 既知の失敗: `tests/rules/firestore.rules.test.ts`（Firebaseエミュレータ + `firestore.rules` パス前提の統合テスト・本ユニットと無関係の環境依存）
- `get_diagnostics`（新規/変更10ファイル）: クリーン
- 既知のlint指摘: `shared/hooks/useCollection.ts:72`（Unit 3由来・本ユニットと無関係）

## 後続ユニットへの引き継ぎ
- **Unit 8（AIキャラクター）**: `useCharacterDialogue` スタブを正式実装に差し替えれば、`CharacterBottomSheet`（gacha_decided）・`RerollLimitScreen`（gacha_reroll_limit）はそのまま機能。RerollLimitScreen はメシストフェレス画像の差し替えを想定
- **演出強化**: `GachaSpinner` の絵文字プレースホルダを用意するカプセルトイ画像に差し替え可能
- **デリバリー誘導**: `config.ts` の `DELIVERY_URL` を正式な誘導先に差し替え
