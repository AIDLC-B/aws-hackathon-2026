# Units Generation 計画

## 計画サマリー

Application Design で確定した4ドメイン構成をベースに、ユニット分解を行う。

### 想定ユニット構成（Application Design から導出）

| ユニット | ドメイン | 対応FR | 対応Lambda | 優先度 |
|---|---|---|---|---|
| Unit 1: 料理管理 | 料理管理ドメイン | FR-00, FR-01 | BE-01: RecipeManagementLambda | 🔴 Must |
| Unit 2: 献立提案 | 献立提案ドメイン | FR-02 | BE-02: MenuSuggestionLambda | 🔴 Must |
| Unit 3: 献立ガチャ | ガチャドメイン | FR-05 | BE-03: GachaLambda | 🔴 Must |
| Unit 4: AIキャラクター | キャラクタードメイン | FR-03, FR-06 | BE-04: CharacterLambda | 🟡 Should |

### 横断的関心事（ユニットに含めない）

| 項目 | 対応 | 理由 |
|---|---|---|
| 認証（BE-05: AuthLambda） | 全ユニット共通の前提条件 | 独立ユニットにするほどの規模ではない |
| フロントエンド shared/ | 全ユニットで共有 | UI Element・共通Hook・Context |

---

## 実行チェックリスト

- [x] Step 1: ユニット分解質問への回答収集
- [x] Step 2: unit-of-work.md 生成（ユニット定義・責務・コード構成）
- [x] Step 3: unit-of-work-dependency.md 生成（依存関係マトリクス）
- [x] Step 4: unit-of-work-story-map.md 生成（ストーリーマッピング）
- [x] Step 5: 整合性検証

---

## 質問

### 質問 1: ユニットの実装順序

4ユニットの実装順序はどうしますか？依存関係から推奨順序を提案します。

**推奨**: Unit 1（料理管理）→ Unit 2（献立提案）→ Unit 3（ガチャ）→ Unit 4（AIキャラクター）

理由:
- Unit 2・3 は Unit 1（料理管理API）に依存する
- Unit 3 は Unit 2（確定済み献立API）にも依存する
- Unit 4 は他ユニットから呼ばれる側だが、マスターデータ投入が必要

A) 推奨順序で進める（Unit 1 → 2 → 3 → 4）
B) Unit 4（AIキャラクター）を先に実装する（マスターデータ準備を先行）
C) Unit 1 と Unit 4 を並行実装する（依存関係がないため）
D) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

### 質問 2: 認証（BE-05）の扱い

認証（BE-05: AuthLambda + Cognito）は独立ユニットにしますか？

A) 独立ユニットにしない（Unit 1 の前提条件として最初に実装する）
B) Unit 0: 認証基盤 として独立ユニットにする
C) その他（[Answer]: タグの後に記述してください）

[Answer]:B

---

### 質問 3: フロントエンドの分割方針

フロントエンドの各 feature は対応するバックエンドユニットと一緒に実装しますか？

A) はい、各ユニットにフロントエンド（feature）+ バックエンド（Lambda）をセットで含める
B) フロントエンドは別ユニットとして分離する（バックエンドAPI完成後にまとめて実装）
C) その他（[Answer]: タグの後に記述してください）

[Answer]:B

---

### 質問 4: shared/ コンポーネントの実装タイミング

shared/ 配下の共通コンポーネント（CharacterBottomSheet / BottomNavigation / ui/ / AuthContext / ConfirmedMenuItemContext）はいつ実装しますか？

A) Unit 1 の実装時に必要なものから順次作成する
B) 全ユニットの前に shared/ を先行実装する
C) 各ユニットで必要になったタイミングで作成する（重複が出たら shared/ に移動）
D) その他（[Answer]: タグの後に記述してください）

[Answer]:C

---

### 質問 5: コード構成（ディレクトリ構造）

Greenfield プロジェクトのコード構成はどうしますか？

A) モノレポ（1リポジトリに全ユニットのコードを配置）
```
/
├── frontend/          ← React アプリ（全 feature）
├── backend/
│   ├── recipe/        ← Unit 1: BE-01
│   ├── suggestion/    ← Unit 2: BE-02
│   ├── gacha/         ← Unit 3: BE-03
│   ├── character/     ← Unit 4: BE-04
│   └── auth/          ← BE-05
└── infra/             ← IaC（CDK / SAM / Terraform）
```

B) フロントエンド・バックエンド分離リポジトリ
C) ユニットごとに独立リポジトリ
D) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

*すべての質問に回答したら「完了」とお知らせください。*
