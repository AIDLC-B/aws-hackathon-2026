# Unit 7: 献立ガチャ — Code Generation 計画

> 設計4ステージはスキップし、Code Generationのみ実行。
> 理由: ガチャ抽選（CF-03）・確率設定（gachaConfig）はApplication Design/Unit 4で確定。画面仕様・リセマラ/堕落ルートはstories（US-10/11/12）・ux-designで確定。新規データモデル/NFR/インフラなし（confirmedMenuItems は Unit 6 で確定済み）。

## ユニットコンテキスト
- **対象**: Unit 7（献立ガチャ）= `features/gacha`（GachaPage・GachaSpinner・GachaResult・RerollLimitScreen・useGacha）
- **配置**: `apps/web/src/features/gacha`
- **対応ストーリー**: US-10（シングルガチャ）, US-11（リセマラ→堕落ルート）, US-12（10連ガチャ・追加/入れ替え）
- **依存（既存資産）**:
  - 型: `@shared/types` の `Recipe` / `GachaResultItem` / `SpinGachaRequest` / `SpinGachaResponse` / `Rarity` / `Source`
  - Functions: `shared/lib/functions` の CF-03 `spinGacha`（実装済み・Unit 4）
  - 確定書き込み: `features/confirmedMenu` の `useConfirmedMenu`（confirm・要 `clearAll` 追加）
  - 料理ラベル: `features/recipe/utils/labels`（RARITY_DISPLAY[N/R/SR/SSR]・DIFFICULTY_LABEL・FREQUENCY_LABEL）
  - キャラ: `features/character`（CharacterBottomSheet [gacha_decided] / useCharacterDialogue [gacha_reroll_limit]）
  - UI: `shared/components/ui`
  - ホーム分岐: `app/HomePage`（確定後の遷移は件数分岐に委譲・1件→詳細 / 10件→リスト）
- **横断依存**:
  - `/gacha` ルートは現在 Unit 6 のプレースホルダ → 本ユニットで `GachaPage` に差し替え
  - 確定時のキャラ一言（gacha_decided）→ CharacterBottomSheet（スタブ・Unit 8で差替）
  - リセマラ上限（gacha_reroll_limit）→ RerollLimitScreen（メシストフェレス固定・スタブ文言は useCharacterDialogue 利用）

## ステージ要否評価（拡張準拠）
| ステージ | 判定 | 理由 |
|---|---|---|
| Functional Design / NFR Requirements / NFR Design / Infrastructure Design | SKIP | 確定済み・新規なし |
| Code Generation | EXECUTE | 常に実行 |
- Security Baseline: Firestoreは `users/{uid}/confirmedMenuItems`（uidスコープ）。CF-03は認証検証済み（Unit 4）。確率は `gachaConfig`（CF-03がAdmin SDKで参照）。FEに新規認可ロジックなし。
- PBT: 抽選確率ロジックはCF-03側（Unit 4で対応済み）。FEは結果表示・リセマラカウント・確定モードのみ → 確率PBTは N/A。リセマラカウント遷移は通常ユニットテストで検証。

---

## 質問

### Question 1: リセマラカウントのセッション管理方式（US-11・要確認・重要）

US-11は「画面遷移しても引き継ぐ／セッション継続中は累積／アプリ完全終了・再起動で0リセット／確定で0リセット」。

A) **`sessionStorage` で管理**（推奨）: 画面遷移・リロードを跨いで保持し、タブ/PWAを閉じると消える。「セッション」の語義に最も合致。`useGacha` 内でカウントを read/write
B) React Context（メモリ保持）: 画面遷移では保持されるが、リロード（F5）でも0に戻る
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 2: 堕落ルートのデリバリー誘導リンク先（US-11）

堕落ルート（5回目リセマラ）でデリバリーアプリ誘導リンクを表示。リンク先URLは未定義。

A) **設定定数（プレースホルダURL）を用意し後で差し替え**（推奨）: `features/gacha/config.ts` に `DELIVERY_URL` を定義（例: Uber Eats / 出前館の汎用トップ）。新規タブで開く（`target="_blank" rel="noopener"`）
B) ダミーリンク（`#`）にして表示のみ
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 3: ガチャ演出（カプセルトイアニメーション）の実装範囲

stories: カプセル回転→開封アニメ。「カプセルトイ画像は開発者が用意」。

A) **CSSベースの簡易演出 + プレースホルダビジュアル**（推奨・ハッカソンスコープ）: 回転→開封の短いCSSアニメ（数百ms）後に結果表示。画像は絵文字/図形のプレースホルダで、後から差し替え可能な構造（`GachaSpinner`）
B) アニメ無し・スピン押下で即結果表示
C) Other (please describe after [Answer]: tag below)

[Answer]:A。簡易演出ですが、可能な限りいい感じにしてください。

### Question 4: 10連の確定（追加/入れ替え）と clearAll 追加（US-12）

US-12: 既存献立が1件以上ある場合「追加する／入れ替える」を選択。component-methods に `clearAllMenuItems` 定義あり。

A) **`useConfirmedMenu` に `clearAll`（全件remove反復）を追加し、`useGacha.confirmGachaResult({ results, mode })` を実装**（add=追加 / replace=全削除して10件）。既存件数>0なら選択ダイアログ、0件なら即追加（推奨）
B) 追加（add）のみ実装し、入れ替え（replace）はUnit後続に先送り
C) Other (please describe after [Answer]: tag below)

[Answer]:C → A で確定（説明後）。add + replace（clearAll追加）両方実装。既存0件は即追加、1件以上は追加/入れ替えダイアログ。

### Question 5: ルーティング/確定後遷移 + テスト範囲

(5a) `/gacha` を `GachaPage` 実体化（プレースホルダ置換）。確定後はボトムシート（gacha_decided）を閉じたら `/` へ戻り、HomePageの件数分岐で 1件→詳細・10件→リストに自動遷移でよいか。
(5b) テストは「フック/ロジック中心 + 軽い描画」（CF-03モック・リセマラカウント遷移[0〜4/5回目堕落]・確定モード[add/replace]・結果件数[1/10]・gacha_reroll_limit描画）でよいか。

A) **両方OK**（GachaPage実体化 + HomePage委譲遷移 + ロジック/軽い描画テスト・推奨）
B) 確定後に明示ルート（/menu/:id・/）へ自前遷移、テストはロジックのみ
C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## 実行ステップ（回答確定後に確定・仮）

- [x] Step 1: `useConfirmedMenu` に `clearAll` 追加（Q4・`features/confirmedMenu`）
- [x] Step 2: `features/gacha/config.ts`（Q2・DELIVERY_URL 等の定数）
- [x] Step 3: `features/gacha/hooks/useGacha.ts`（CF-03 spinGacha・confirmGachaResult[add/replace]・リセマラカウント[Q1]・堕落判定）
- [x] Step 4: `features/gacha/components/GachaSpinner.tsx`（Q3・カプセル演出スタブ）
- [x] Step 5: `features/gacha/components/GachaResult.tsx`（結果表示[N/R/SR/SSR・料理名・頻度・難易度・所要時間]・1件/10連一覧・もう一度/これにする！）
- [x] Step 6: `features/gacha/components/RerollLimitScreen.tsx`（US-11・メシストフェレス固定・デリバリー誘導[Q2]・やっぱり作る）
- [x] Step 7: `features/gacha/pages/GachaPage.tsx`（US-10/12・シングル/10連・演出→結果→確定/リセマラのディスパッチ・確定モードダイアログ[Q4]）
- [x] Step 8: ルーティング結線（Q5a・`/gacha` を GachaPage に差し替え）
- [x] Step 9: テスト（Q5b）
- [x] Step 10: ドキュメント（`aidlc-docs/construction/unit7-gacha/code/code-summary.md`）
- [x] Step 11: 整合性確認（typecheck/build・get_diagnostics・FSD準拠）

---

*質問に回答したら「回答しました」とお知らせください。推奨でよければ「すべてAで進めて」でOKです。*
