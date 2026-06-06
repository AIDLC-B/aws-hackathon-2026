# Units Generation 計画（Firebase版）

> **注**: 本計画は旧AWS版（Lambda/DynamoDB/Cognito）を全面刷新し、現行のFirebaseアーキテクチャ（Cloud Functions + Firestore + Cloud Storage + Firebase Auth + Claude API、フロントエンド直接アクセス + CRUD 2層構造 + マスターデータ）に基づいて再構成したものです。

## 計画サマリー

現行アーキテクチャはフロントエンド中心（React + FSD 8ドメイン）で、バックエンドは最小限のCloud Functions 3種（CF-01/02/03）のみ。認証はFirebase Auth（マネージド）、データアクセスはフロントエンドからFirestore/Cloud Storageへ直接（Security Rulesで保護）。この特性を踏まえたユニット分解を決定する。

### アーキテクチャ要素の棚卸し

| 要素 | 内容 |
|---|---|
| フロントエンド features | auth / onboarding / recipe / suggestion / gacha / confirmedMenu / character / settings |
| フロントエンド shared | useCollection / useDocument（汎用プリミティブ）, useMasterData, UI Element, lib（firebase/functions/storage） |
| app/providers | AuthProvider, MasterDataProvider, AppProvider |
| Cloud Functions | CF-01 analyzeRecipeImage / CF-02 suggestMeals / CF-03 spinGacha |
| Firestore | users/{uid}（recipes, confirmedMenuItems サブコレクション）, characterDialogues, gachaConfig, difficultyMaster, rarityMaster |
| Security Rules | Firestore Security Rules / Cloud Storage Security Rules |
| マスターデータ | characterDialogues, difficultyMaster, rarityMaster, gachaConfig の投入（seed） |
| Firebase基盤 | プロジェクト設定, Authentication, Hosting |

---

## 実行チェックリスト（Part 2で実行）

- [x] Step 1: ユニット分解質問への回答収集（本計画のQ1〜Q7）
- [x] Step 2: unit-of-work.md 生成（ユニット定義・責務・コード構成）
- [x] Step 3: unit-of-work-dependency.md 生成（依存関係マトリクス）
- [x] Step 4: unit-of-work-story-map.md 生成（ストーリーマッピング）
- [x] Step 5: 整合性検証（全ストーリー割り当て・依存整合）

---

## 質問

以下の質問に `[Answer]:` タグの後にご回答ください。

### Question 1: ユニット分解の基本戦略

Firebaseはフロントエンド中心・薄いバックエンドのため、分解方針を決めます。

A) **レイヤー水平分割** — Firebase基盤 / 共有基盤(shared) / 各機能フロントエンド / Cloud Functions を層で分ける
B) **機能垂直分割（フルスタックスライス）** — 各ユニット = 機能のフロントエンド + 対応Cloud Function + Firestoreルール断片をまとめる
C) **ハイブリッド** — 基盤系（Firebase設定・shared・Security Rules・マスターseed）は横断ユニット、機能系は機能ごとの垂直ユニット
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 2: Firebase基盤ユニットの扱い

プロジェクト設定・Firebase Authentication・Firestore/Storage Security Rules・Hosting設定をどう扱いますか？

A) 独立した「Firebase基盤ユニット」にまとめ、最初に実装する
B) 各機能ユニットに分散させる（Security Rulesは関連コレクションを持つユニットが担当）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: 共有基盤（shared）の扱い

汎用Firestoreプリミティブ（useCollection/useDocument）、useMasterData、UI Element、lib（firebase/functions/storage）、providersをどう扱いますか？

A) 独立した「共有基盤ユニット」として先行実装（他ユニットの前提）
B) 各機能ユニットで必要になったタイミングで作成（重複が出たらsharedへ移動）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: Cloud Functions（CF-01/02/03）の所属

3つのCloud Functionsをどう配置しますか？

A) 各機能ユニットに含める（CF-01→料理管理、CF-02→献立提案、CF-03→ガチャ）
B) 独立した「Cloud Functionsユニット」に3種まとめる
C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 5: マスターデータ投入（seed）の所属

characterDialogues / difficultyMaster / rarityMaster / gachaConfig の投入スクリプトをどのユニットが持ちますか？

A) Firebase基盤ユニット（または共有基盤）が一括で持つ
B) 各データを使うユニットが個別に持つ（dialogues→キャラクター、gachaConfig→ガチャ、difficulty/rarity→基盤）
C) Other (please describe after [Answer]: tag below)

[Answer]: C（別フォルダでインストレーションガイドなどと一緒に管理）

#### Question 5a（フォローアップ）: seed/セットアップの「所属ユニット」

Q5で「別フォルダで管理」とのことでした。フォルダ配置（例: `setup/` にseedスクリプト + SETUP.md）は理解しました。ユニット分解上、この成果物の**所属**をどう扱いますか？

A) **独立した「セットアップ／マスターデータ ユニット」** として扱う（seed投入スクリプト + インストレーションガイド + 全マスターデータJSONを一括所有）。Firebase基盤ユニットの直後に実装
B) Firebase基盤ユニットの責務に含める（基盤ユニットが `setup/` フォルダごと所有）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: 実装順序

ユニットの実装順序の希望は？（依存関係から基盤→共有→機能の順を推奨）

A) 推奨順（Firebase基盤 → 共有基盤 → 料理管理 → 献立提案 → ガチャ → AIキャラクター）
B) 機能を優先（最小機能を縦に早く動かす）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7: コード構成（ディレクトリ構造）

Greenfieldプロジェクトのコード構成は？

A) モノレポ（推奨）
```
/
├── src/                  ← React アプリ（app / features / shared / assets）
├── functions/            ← Cloud Functions（CF-01/02/03）
├── firestore.rules       ← Firestore Security Rules
├── storage.rules         ← Cloud Storage Security Rules
├── firestore.indexes.json
├── scripts/seed/         ← マスターデータ投入スクリプト
├── firebase.json         ← Firebase設定
└── aidlc-docs/           ← ドキュメント（コードではない）
```
B) フロントエンドとfunctionsを別リポジトリに分離
C) Other (please describe after [Answer]: tag below)

[Answer]: A（すでにフォルダ構成は決定している認識だが？）

---

*すべての質問に回答したら「回答しました」とお知らせください。*
