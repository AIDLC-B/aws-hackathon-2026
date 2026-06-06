# Application Design Plan（Firebase版）

## 概要
Firebaseアーキテクチャに基づくアプリケーション設計計画。
既存のUser Stories・UX設計を維持しつつ、技術スタックをFirebaseに全面移行する。

## 設計方針
- **フロントエンド中心設計**: CRUD操作はフロントエンドからFirestoreに直接アクセス
- **Cloud Functionsは最小限**: Claude API呼び出しのみ
- **Firestore Security Rules**: 認可・データアクセス制御の中心
- **コスト最適化**: Firebase無料枠内で運用可能な設計

## 設計チェックリスト

### Phase 1: コンポーネント設計
- [x] フロントエンドコンポーネント構成（FSD的構成）
- [x] Cloud Functions定義（最小限）
- [x] Firestoreコレクション設計
- [x] Firebase Authentication統合設計

### Phase 2: コンポーネントメソッド定義
- [x] フロントエンドサービス層のメソッド定義
- [x] Cloud Functionsのエンドポイント定義
- [x] Firestoreクエリパターン定義

### Phase 3: サービス層設計
- [x] ドメイン間通信パターン
- [x] Firestoreデータフロー
- [x] Cloud Functions呼び出しフロー
- [x] キャラクタードメインIF設計

### Phase 4: 依存関係設計
- [x] コンポーネント依存関係マトリクス
- [x] データフロー図
- [x] Firestoreコレクション間の参照関係

### Phase 5: ストレージ設計（追加）
- [x] Cloud Storage ブラウザ直接アクセス方針（アップロード・読み取り）
- [x] Cloud Storage Security Rules 設計（本人ディレクトリ限定・サイズ/MIME制限）

### Phase 6: 統合設計ドキュメント
- [x] application-design.md（統合ドキュメント）
- [x] 整合性確認

### Phase 7: CRUD共通化（2層構造・追加）
- [x] shared に汎用Firestoreプリミティブ層（useCollection/useDocument + 汎用CRUD）を新設
- [x] 各featureのドメイン固有hooksをプリミティブ利用側に再定義（コレクション名・スキーマ・バリデーション・業務ルール保持）

### Phase 8: マスター化（追加）
- [x] 判定基準の確定（付随属性を持つ値=マスター化、純粋な制御フローenum=コード）
- [x] difficultyMaster / rarityMaster をFirestoreマスターコレクションとして定義（id/label/order）
- [x] rarityの確率はgachaConfigが保持（rarityMasterは表示属性のみ）
- [x] マスターデータ取得の設計（MasterDataProvider + useMasterData・セッションキャッシュ）
- [x] Security Rules（マスターは読み取り専用）反映

---

## 設計質問

以下の質問に回答してください。

## Question 1
フロントエンドのコンポーネント設計方針について、前回のFSD（Feature-Sliced Design）的な4階層モデル（Page/Widget/Feature Component/UI Element）を維持しますか？

A) 維持する（前回と同じ4階層モデル）
B) 簡素化する（Page/Component の2階層で十分）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Firestoreのコレクション設計方針について。前回のDynamoDB設計ではドメインごとにテーブルを所有する原則でした。Firestoreでも同様にドメインごとにトップレベルコレクションを分離しますか？

A) ドメインごとにトップレベルコレクションを分離（recipes, confirmedMenuItems, characterDialogues, users）
B) ユーザーをルートとしたサブコレクション構成（users/{uid}/recipes, users/{uid}/confirmedMenuItems）
C) ハイブリッド（ユーザー固有データはサブコレクション、マスターデータはトップレベル）
D) Other (please describe after [Answer]: tag below)

[Answer]: B＋C（ユーザーデータをユーザーをルートとしたサブコレクション構成、マスターデータは別コレクションで格納）

## Question 3
Cloud Functionsの設計方針について。Claude API呼び出し以外にCloud Functionsを使う場面はありますか？

A) Claude API呼び出しのみ（料理写真認識）
B) Claude API呼び出し + ガチャ抽選ロジック（レアリティ確率計算をサーバーサイドで実行）
C) Claude API呼び出し + ガチャ抽選 + 献立提案フィルタリング（ビジネスロジックをサーバーサイドに集約）
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
キャラクター台詞のマスターデータ管理について。前回はDynamoDBのマスターテーブルに格納し、Bedrockで手動生成する方針でした。Firestoreでも同様にマスターデータとして管理しますか？

A) Firestoreのマスターコレクションに格納（前回と同じ方針・Claude APIで手動生成）
B) フロントエンドの静的データとして管理（JSONファイル等・Firestore読み取り回数を節約）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
ガチャの抽選ロジック（レアリティ確率計算）の実行場所について。前回はBE-03（GachaLambda）で実行する方針でした。

A) Cloud Functionsで実行（サーバーサイド・確率操作防止）
B) フロントエンドで実行（コスト削減・Cloud Functions呼び出し回数節約）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
Firestore Security Rulesの設計粒度について。

A) コレクションごとに詳細なルール（読み取り/書き込み/削除を個別制御）
B) 基本ルール（認証済みユーザーは自分のデータのみアクセス可）+ マスターデータは読み取り専用
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
前回のApplication Designで確定したキャラクタードメインのIF設計（trigger/from/isPremiumを渡し、キャラクター・トーン選択は内部で決定）は維持しますか？

A) 維持する（ロジックはフロントエンド内のキャラクターモジュールで実行）
B) 変更したい（具体的に記述してください）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8（変更依頼により追加）
Cloud Storage（料理写真）へのアクセス方針について。当初はアップロードをフロントエンド直接、読み取りも直接想定でしたが、明示的にブラウザ直接アクセスへ統一します。その際のセキュリティ確保方針は？

A) Cloud Storage Security Rules で本人ディレクトリ（`recipe-images/{uid}/`）のみ読み書き許可 + ファイルサイズ上限 + MIME型制限（画像のみ）
B) Cloud Functions 経由でアップロード（署名付きURL発行）
C) Other (please describe after [Answer]: tag below)

[Answer]: A（ブラウザから直接アクセス。Cloud Storage Security Rules で本人ディレクトリ限定・サイズ/MIME制限を厳格に適用）

## Question 9（変更依頼により追加）
CRUD操作の責務分離について。各featureに散在していたFirestore CRUDを2層に分離します。

A) 2層構造：
   - **層1（共通・shared）**: 汎用Firestoreプリミティブ。`useCollection<T>(path)` / `useDocument<T>(path)` と汎用 create/update/delete。型はジェネリック。エラー・ローディング・購読解除を共通化。コレクション非依存の薄いラッパー
   - **層2（ドメイン固有・各feature）**: プリミティブを内部利用。コレクション名・スキーマ・バリデーション・業務ルールを保持。例：`useRecipes()` が内部で `useCollection<Recipe>('users/{uid}/recipes')` を呼ぶ
B) Other (please describe after [Answer]: tag below)

[Answer]: A（2層構造で分離。汎用プリミティブをsharedへ、ドメイン固有CRUDは各featureに残す）

---

## マスター化方針の決定（変更依頼）

現状、`difficulty` や `rarity` などのenum的な値がFirestoreの各ドキュメントに生の値として埋め込まれています。これらを「マスター」として一元管理したいというご要望です。一方で、enum的な埋め込み値は他にも多数あり、全てをマスター化するのは過剰です。以下で「何をマスター化し、何はコードのまま残すか」を決定します。

### 現状のenum的な埋め込み値の棚卸し

| 値 | 使用箇所 | 付随属性の有無 | 性質 |
|---|---|---|---|
| `rarity` (N/R/SR/SSR) | recipes, confirmedMenuItems, gachaConfig | あり（確率・表示順・色など） | 表示・抽選に使う **マスター候補** |
| `difficulty` (easy/normal/hard) | recipes, confirmedMenuItems | あり（日本語ラベル・表示順） | 表示・フィルタに使う **マスター候補** |
| `tone` (encouragement/scolding/praise/empathy) | characterDialogues | ほぼなし（分類用） | 制御・分類 |
| `trigger` (meal_decided 等) | characterDialogues, UI | なし | UIロジックに密結合 |
| `from` (suggestion/gacha 等) | UI遷移コンテキスト | なし | UIロジックに密結合 |
| `source` (suggestion/gacha/gacha_10) | confirmedMenuItems | なし | 記録用フラグ |
| `characterId` (7キャラ) | characterDialogues, UI | あり（名前・画像・トーン） | **マスター候補**（要検討） |

### 提案する判定基準（マスター化 vs コード）

- **マスター化する**: 値に付随属性（ラベル・表示順・色・確率など）を持つ／表示や計算で参照される／非エンジニアが将来変更し得る
- **コードのまま残す**: 付随属性を持たない純粋な制御フロー/分類用enum／UIロジックに密結合／変更頻度が極めて低く型安全性を優先したい

この基準では `rarity` `difficulty`（および候補として `characterId`）がマスター化対象、`tone` `trigger` `from` `source` はコード（TypeScript union型）のまま残す、という整理になります。

---

## Question 10
上記の「判定基準」を採用しますか？

A) 採用する（付随属性を持つ値=マスター化、純粋な制御フローenum=コードのまま）
B) 修正したい（具体的に記述してください）
C) Other (please describe after [Answer]: tag below)

[Answer]: A（ただし、キャラクターはマスター化しなくてよい）

## Question 11
`difficulty` と `rarity` のマスターの**保存場所**について。本プロジェクトはFirebase無料枠内のコスト最適化を重視しています。

A) 静的コード定数（TypeScript）で一元管理 — Firestore読み取りゼロ・型安全・変更時はデプロイ要（コスト最優先）
B) Firestoreマスターコレクション（difficultyMaster / rarityMaster）— characterDialoguesと同じ方式・デプロイなしで変更可・読み取りコスト発生
C) ハイブリッド — `rarity` は既存 `gachaConfig`（確率を持つ）に統合してFirestore管理、`difficulty` は静的コード定数
D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 12
マスターに持たせる**属性**について（複数選択可・カンマ区切りで回答）。

- 共通候補: `id`（識別子）, `label`（日本語表示名）, `order`（表示順）, `color`（バッジ色等）
- rarity固有候補: `probability`（ガチャ確率・現状gachaConfigが保持）
- characterId（マスター化する場合）候補: `name`, `imagePath`, `availableTones`

A) id + label + order のみ（最小構成）
B) id + label + order + color（表示装飾含む）
C) id + label + order + color + rarity固有のprobability（rarityはgachaConfigと統合）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 13
`characterId`（7キャラクター）もマスター化対象に含めますか？（名前・画像パス・対応トーンを持つため候補）

A) 含める（characterMaster として管理）
B) 含めない（今回は difficulty / rarity のみマスター化、characterは現状維持）
C) Other (please describe after [Answer]: tag below)

[Answer]: B
