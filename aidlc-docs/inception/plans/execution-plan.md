# 実行計画書

## 詳細分析サマリー

### 変更影響評価
- **ユーザー向け変更**: Yes — 新規アプリ全体がユーザー体験に直結
- **構造的変更**: Yes — フロントエンド・バックエンド・AI連携の複数コンポーネント構成
- **データモデル変更**: Yes — 料理レパートリー・レアリティ・ユーザー情報（isPremiumフラグ含む）などのスキーマ設計が必要
- **API変更**: Yes — 料理登録・献立提案・ガチャなど複数エンドポイントの新規設計
- **NFR影響**: Yes — AI連携のレスポンス要件・AWSサービス選定・PBT適用

### リスク評価
- **リスクレベル**: Medium
- **ロールバック複雑度**: Moderate（AWSサービス複数利用）
- **テスト複雑度**: Moderate（AI連携 + ガチャロジック + PBT）

---

## ワークフロー可視化

```
INCEPTION PHASE
+---------------------------+
| Workspace Detection       | COMPLETED
| Reverse Engineering       | SKIPPED (Greenfield)
| Requirements Analysis     | COMPLETED & APPROVED
| User Stories              | EXECUTE
| Workflow Planning         | IN PROGRESS
| Application Design        | EXECUTE
| Units Generation          | EXECUTE
+---------------------------+
            |
CONSTRUCTION PHASE
+---------------------------+
| Functional Design         | EXECUTE
| NFR Requirements          | EXECUTE
| NFR Design                | EXECUTE
| Infrastructure Design     | EXECUTE
| Code Generation           | EXECUTE (ALWAYS)
| Build and Test            | EXECUTE (ALWAYS)
+---------------------------+
            |
OPERATIONS PHASE
+---------------------------+
| Operations                | PLACEHOLDER
+---------------------------+
```

---

## 実行フェーズ詳細

### 🔵 INCEPTION PHASE
- [x] Workspace Detection — COMPLETED
- [x] Reverse Engineering — SKIPPED（グリーンフィールドのため）
- [x] Requirements Analysis — COMPLETED & APPROVED
- [ ] User Stories — **EXECUTE**
  - **理由**: 具体的な入力項目・ユースケース・業務ドメインの検討のため実施。ユーザーからの明示的な要望。
- [x] Workflow Planning — IN PROGRESS
- [ ] Application Design — **EXECUTE**
  - **理由**: フロントエンド・バックエンド・AI連携の3層構成で新規コンポーネントが多数必要。料理登録・献立提案・ガチャ・AIキャラクターなどのサービス層設計が必要。
- [ ] Units Generation — **EXECUTE**
  - **理由**: 複数の独立したユニット（料理管理・献立提案・ガチャ・AIキャラクター）に分解することで、ハッカソン内での並行開発が可能になる。

### 🟢 CONSTRUCTION PHASE（各ユニット共通）
- [ ] Functional Design — **EXECUTE**
  - **理由**: 料理レパートリーのデータモデル・レアリティ算出ロジック・ガチャアルゴリズムなど、詳細な業務ロジック設計が必要。
- [ ] NFR Requirements — **EXECUTE**
  - **理由**: AI連携のレスポンス要件（5秒以内）・AWSサービス選定・PBT適用方針の確定が必要。
- [ ] NFR Design — **EXECUTE**
  - **理由**: NFR要件をアーキテクチャに落とし込む設計（Lambda構成・Bedrock連携パターン・DynamoDB設計）が必要。
- [ ] Infrastructure Design — **EXECUTE**
  - **理由**: AWS各サービス（Bedrock・Lambda・DynamoDB・S3・Cognito）のマッピングと構成設計が必要。
- [ ] Code Generation — **EXECUTE**（ALWAYS）
- [ ] Build and Test — **EXECUTE**（ALWAYS）

### 🟡 OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

---

## 想定ユニット構成（Units Generation で確定）

| ユニット | 主な機能 | 優先度 |
|---|---|---|
| Unit 1: 料理管理 | FR-01 料理登録・レパートリー管理・検索API提供 | 🔴 Must |
| Unit 2: 献立提案 | FR-02 ワンボタン提案・フィルタリング、FR-04 ストリーク・週次レポート | 🔴 Must |
| Unit 3: 献立ガチャ | FR-05 ガチャ演出・レアリティ抽選・リセマラ管理 | 🔴 Must |
| Unit 4: AIキャラクター | FR-03 今日の一言・7キャラクター・Bedrock連携、FR-06 プレミアムフラグ参照 | 🟡 Should |

---

## 成功基準
- **主目標**: ハッカソンデモで「料理登録 → ワンボタン提案 → ガチャ → 堕落ルート」の流れが動く
- **主要成果物**: 動作するWebアプリ（React + AWS）
- **品質ゲート**: PBT適用済みのガチャ・提案ロジック、AI連携レスポンス5秒以内
