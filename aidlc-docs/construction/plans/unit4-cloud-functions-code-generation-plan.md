# Unit 4: Cloud Functions — Code Generation 計画

> Unit 4は設計4ステージ（Functional Design / NFR Requirements / NFR Design / Infrastructure Design）をスキップし、Code Generationのみ実行。
> 理由: CF-01/02/03の入出力・処理ロジックはApplication Design（component-methods.md「Cloud Functions エンドポイント定義」）で確定済み。Firebaseインフラ・NFR要件はUnit 1で定義済み。新規業務ドメインモデルなし。

## ユニットコンテキスト
- **対象**: Unit 4（Cloud Functions）
- **配置**: `functions/`（ワークスペースルート・`firebase.json` の `functions.source` で参照済み）
- **依存**:
  - Unit 1（Firebase初期化・Firestore Security Rules・`firebase.json` のfunctions/emulator設定済み）
  - Unit 2（マスターデータ投入済み: `gachaConfig` コレクション・確率 N=0.6/R=0.25/SR=0.12/SSR=0.03）
- **利用元**: フロントエンド（Unit 5: CF-01、Unit 6: CF-02、Unit 7: CF-03）。呼び出しは `src/shared/lib/functions.ts` の `callFunction(name, data)` 経由。関数名は `analyzeRecipeImage` / `suggestMeals` / `spinGacha`、リージョンは `us-central1`。

## ステージ要否評価（拡張準拠サマリー）
| ステージ | 判定 | 理由 |
|---|---|---|
| Functional Design | SKIP | CF入出力・処理フローはApplication Designで確定済み |
| NFR Requirements | SKIP | 新規NFRなし（Firebase/Claude APIのNFRはUnit 1で定義） |
| NFR Design | SKIP | NFR Requirements未実行のため連動スキップ |
| Infrastructure Design | SKIP | FirebaseインフラはUnit 1で定義済み（functions設定は既存 `firebase.json`） |
| Code Generation | EXECUTE | 常に実行 |

### 拡張ルール適用
- **Security Baseline拡張（Enabled）**: Callable Functionsは全て `request.auth` を検証し、未認証は `unauthenticated` エラーを返す（**該当・実装する**）。Claude APIキーはコードに埋め込まず Secret Manager（`defineSecret`）で管理（**該当・実装する**）。入力バリデーション（count・imageUrl等）を実施（**該当・実装する**）。
- **Property-Based Testing拡張（Partial）**: CF-03の**レアリティ抽選ロジック**は確率分布を持つため fast-check によるPBT対象（**該当**）。CF-01/CF-02は通常の単体テスト。

## 既存資産（重複回避）
- `firebase.json`: `"functions": { "source": "functions" }` 設定済み・Functions Emulator port 5001 設定済み → **そのまま利用**（変更なし）
- `src/shared/lib/functions.ts`: フロント側呼び出しヘルパー（関数名・us-central1）→ **CF側の関数名/リージョンをこれに整合**
- `setup/seed/data/gacha-config.json`: gachaConfigマスター（CF-03が参照）→ **そのまま利用**
- 共有型 `src/shared/types/index.ts` の `Difficulty` / `Rarity` 等 → CF側は独立パッケージのため**参照せず、functions側に同等のサーバー型を定義**（モノレポだがfunctionsは別tsconfig/別依存のため型は二重定義。値の整合は維持）

---

## 質問

### Question 1: Recipe サーバー型の定義方法

CF-02/CF-03はFirestoreの `users/{uid}/recipes` を読むため `Recipe` 型が必要だが、共有層（`src/shared/types`）にはまだRecipe型が未定義（Unit 5で定義予定）。functionsは別tsconfig・別依存のパッケージ。

A) **functions側に独立した型定義 `functions/src/types.ts` を作成**（Recipe / GachaConfig / フィルタ入出力型をサーバー用に定義。Unit 5のフロント型とフィールドを揃える・推奨）
B) フロントの `src/shared/types` をfunctionsからも相対パスでimport（パッケージ境界を越える・非推奨）
C) Other (please describe after [Answer]: tag below)

[Answer]:Bでもいい気がしますが、なぜ非推奨なのでしょうか？むしろこういうときのためにsharedがあるイメージです。

### Question 2: Claude API クライアントの実装方式（CF-01）

CF-01（analyzeRecipeImage）はClaude API（Vision）で料理写真を認識する。

A) **`@anthropic-ai/sdk` を依存に追加し、Secret Manager のAPIキーで呼び出し**。`CLAUDE_MOCK=true` 時は固定レスポンス（`{ name:"テスト料理", difficulty:"normal", duration:15, rarity:"R" }`）を返す（推奨・unit-of-work記載のモック戦略に準拠）
B) SDKを使わず fetch でAnthropic REST APIを直接呼び出し（依存最小化）
C) Other (please describe after [Answer]: tag below)

[Answer]:Aで実装してください。万が一懸念点があったら教えてね。また、他のAIモデル(OpenAI)とかにも切り替えできるようにしておいてね。envとかで簡単にできると嬉しいな。

### Question 3: gachaConfig の取得とフォールバック（CF-03）

CF-03はレアリティ確率を `gachaConfig` コレクションから取得する。

A) **毎回Firestoreから取得し、取得失敗/空の場合はデフォルト確率（N=0.6/R=0.25/SR=0.12/SSR=0.03）にフォールバック**（推奨・component-methods.md記載のデフォルト値準拠）
B) Firestoreからのみ取得し、空ならエラー返却（フォールバックなし）
C) Other (please describe after [Answer]: tag below)

[Answer]:AでOKです。ただ頻繁に変わるものではないので、1回取得したら、情報が消えるまでスキップするようにしてください。方法はお任せします。

### Question 4: テストの範囲とPBT適用

本ユニットで生成する単体テスト（実行はBuild & Testフェーズ）。

A) **CF-03抽選はPBT（fast-check）+ CF-01/CF-02は通常の単体テスト**（Firestore/Claude APIはモック・推奨）。PBT検証項目: 確率総和・全レアリティが妥当範囲・count分の重複なし・在庫不足時の挙動
B) 全CFを通常の単体テストのみ（PBTなし）
C) テストは今回生成せず Build & Test フェーズでまとめて
D) Other (please describe after [Answer]: tag below)

[Answer]:Bでお願い。

### Question 5: 抽選時に該当レアリティの在庫がない場合の挙動（CF-03）

ガチャで抽選したレアリティのレシピがユーザーレパートリーに存在しない場合の扱い。

A) **隣接レアリティへフォールバック**（抽選レアリティに在庫がなければ他レアリティから補完し、count分を可能な限り埋める・推奨）
B) そのレアリティはスキップしcount未満でも返す（在庫がある分だけ返却）
C) Other (please describe after [Answer]: tag below)

[Answer]:Ad

---

## 回答確定サマリー（2026-06-27・改訂）
- **Q1 → shared一本化を採用（ユーザー判断）＋中立配置**。当初Aを提案したが、ユーザー方針により**ドメイン型・CF契約型はフロント/Functions共通の単一ソースで一元管理**する。さらに配置の正しさを優先し、フロント内部の `src/shared` ではなく、どちらのバウンダリにも属さない**中立フォルダ `/shared/types` を真の単一ソース**とした。
  - 私が当初挙げた懸念は以下の方法で解消:
    - **Timestamp非互換** → 中立型をSDK非依存化（`FirestoreTimestamp` 構造型を定義し、client/admin両SDKのTimestampを構造的に受容）。
    - **デプロイ境界** → functionsは中立型を `export type` で再エクスポート/`import type` で参照。型は実行時に消去されるためFunctionsバンドルに実体は含まれない（コンパイル後 `lib/functions/src/types.js` は空・確認済み）。
  - 配置: `/shared/types`（中立・単一ソース）← `src/shared/types`（再エクスポート+フロント専用UI型）/ `functions/src/types.ts`（再エクスポート）。依存の向きは「両者 → 中立共通基盤」。
  - `functions/tsconfig.json` は `rootDir: ".."`・`include: ["src", "../shared/types"]`、エントリは `lib/functions/src/index.js`。フロントは `@shared/*` エイリアス（tsconfig paths + vite alias）で中立を解決。
  - **既存方針の改訂**: Unit 3のQ2=B（ドメインエンティティ型は各機能ユニットで定義）を上書き。ドメイン型は中立 `/shared` へ集約。
- **Q2 → A採用 + 拡張要件**: `@anthropic-ai/sdk` 使用 + Secret Manager。加えて**AIプロバイダ抽象化層**を設け、環境変数 `LLM_PROVIDER`（`anthropic` / `openai` / `mock`）で切替可能にする。`CLAUDE_MOCK=true` も後方互換で尊重。
  - **懸念点（ユーザー依頼により明記）**: (1) AnthropicとOpenAIでVision入力フォーマット・レスポンス構造が異なるため、プロバイダ実装内で正規化が必要。(2) openai SDKを追加するとデプロイ依存が増える（コールドスタート微増）。(3) APIキーはプロバイダごとに別Secret（`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`）が必要。
- **Q3 → A採用 + キャッシュ**: gachaConfigはFirestoreから取得し、失敗/空時はデフォルト確率にフォールバック。さらに**モジュールレベルのメモリキャッシュ**で一度取得したらインスタンス存続中は再取得しない（Cloud Functionsのウォームインスタンスで有効）。
- **Q4 → B採用**: 全CFを通常の単体テストのみ（PBTなし）。※Property-Based Testing拡張（Partial）はユーザー判断により本ユニットでは適用見送り（Build & Testフェーズで追加余地あり）。
- **Q5 → A採用**: 抽選レアリティに在庫がなければ隣接レアリティへフォールバックし、count分を可能な限り充足。

## 実行ステップ（確定）

- [x] Step 1: functionsパッケージ初期化（`functions/package.json`[main=lib/functions/src/index.js]・`functions/tsconfig.json`[rootDir=..]・`functions/.gitignore`・`functions/vitest.config.ts`・Node 20 / firebase-functions v2 / firebase-admin / @anthropic-ai/sdk / openai / vitest）
- [x] Step 2: 型の中立共有一本化（Q1）。`/shared/types/index.ts`（中立・新規）をSDK非依存（`FirestoreTimestamp`）で作成し、ドメイン型（Recipe/RecipeInput/ConfirmedMenuItem）・CF契約型（RecipeAnalysis/各CF入出力/GachaResultItem）・union/マスター型/UserProfile/CharacterId・Lineを集約。`src/shared/types` は中立への再エクスポート+フロント専用UI型、`functions/src/types.ts` は中立への再エクスポートバレル。フロントは `@shared` エイリアス追加
- [x] Step 3: 共通基盤
  - [x] `functions/src/lib/admin.ts`（Firebase Admin初期化）
  - [x] `functions/src/lib/auth.ts`（`request.auth`検証ヘルパー）
  - [x] `functions/src/lib/gachaConfig.ts`（gachaConfig取得＋モジュールキャッシュ＋デフォルトフォールバック・Q3）
  - [x] `functions/src/lib/llm/`（プロバイダ抽象化・Q2：`types.ts`/`index.ts`[env切替+Secret]/`anthropic.ts`/`openai.ts`/`mock.ts`/`parse.ts`/`image.ts`）
- [x] Step 4: CF-01 `functions/src/analyzeRecipeImage.ts`（LLM抽象経由でVision認識・モック対応・認証検証・imageUrlバリデーション）
- [x] Step 5: CF-02 `functions/src/suggestMeals.ts`（レシピ取得→確定済み除外→difficulty/duration絞り込み→ランダム最大3品・needsGachaRedirect判定。純粋ロジックは`lib/suggestLogic.ts`）
- [x] Step 6: CF-03 `functions/src/spinGacha.ts`（gachaConfig取得[Q3]→レアリティ抽選→在庫フォールバック[Q5]→count分重複なし・count∈{1,10}バリデーション。純粋ロジックは`lib/gachaLogic.ts`）
- [x] Step 7: エントリポイント（`functions/src/index.ts`・3関数をus-central1でexport）
- [x] Step 8: テスト生成（Q4=B・通常単体テスト48件・`functions/src/__tests__/`・Firestore/LLMモック）→ 全48件pass
- [x] Step 9: ドキュメント生成（`aidlc-docs/construction/unit4-cloud-functions/code/code-summary.md`）
- [x] Step 10: 整合性確認（`npm run build`成功・get_diagnosticsクリーン・フロント`functions.ts`の関数名/リージョンと一致・入出力型がcomponent-methods.mdと一致）

---

*回答確定。上記ステップで生成を実行します。*
