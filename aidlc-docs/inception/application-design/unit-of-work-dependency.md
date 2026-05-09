# ユニット依存関係

## 依存関係マトリクス

| 依存元 ↓ / 依存先 → | Unit 0 認証 | Unit 1 料理管理 | Unit 2 献立提案 | Unit 3 ガチャ | Unit 4 AIキャラ | Unit 5 FE |
|---|---|---|---|---|---|---|
| **Unit 0 認証** | — | — | — | — | — | — |
| **Unit 1 料理管理** | ✅ 認証必須 | — | — | — | — | — |
| **Unit 2 献立提案** | ✅ 認証必須 | ✅ レシピ取得API | — | — | — | — |
| **Unit 3 ガチャ** | ✅ 認証必須 | ✅ レシピ取得API | ✅ 確定済み献立API | — | — | — |
| **Unit 4 AIキャラ** | ✅ 認証必須 | — | — | — | — | — |
| **Unit 5 FE** | ✅ 認証連携 | ✅ 全API | ✅ 全API | ✅ 全API | ✅ 全API | — |

---

## 依存関係図

```
Unit 0: 認証基盤
  ↑（認証必須）
  |
  +--- Unit 1: 料理管理
  |      ↑（レシピ取得API）
  |      |
  |      +--- Unit 2: 献立提案
  |      |      ↑（確定済み献立API）
  |      |      |
  |      +------+--- Unit 3: ガチャ
  |
  +--- Unit 4: AIキャラクター
  |
  +--- Unit 5: フロントエンド（全バックエンドユニットに依存）
```

---

## 実装順序（確定）

```
Phase 1: Unit 0（認証基盤）
    ↓
Phase 2: Unit 1（料理管理）
    ↓
Phase 3: Unit 2（献立提案）
    ↓
Phase 4: Unit 3（ガチャ）
    ↓
Phase 5: Unit 4（AIキャラクター）
    ↓
Phase 6: Unit 5（フロントエンド）← 全バックエンドAPI完成後
```

---

## 通信方式

| 通信パターン | 方式 | 例 |
|---|---|---|
| FE → BE | REST API（API Gateway経由） | フロントエンド → 各Lambda |
| BE → BE（同期） | 内部API呼び出し（Lambda → API Gateway → Lambda） | BE-02 → BE-01、BE-03 → BE-01/BE-02 |
| FE → Cognito | Amplify Auth SDK | ログイン・サインアップ |
| BE → AWS サービス | AWS SDK | Lambda → DynamoDB / S3 / Bedrock |

---

## 共有リソース

| リソース | 所有ユニット | 利用ユニット | アクセス方式 |
|---|---|---|---|
| Cognito User Pool | Unit 0 | 全ユニット | Cognito Authorizer |
| DynamoDB Users | Unit 0 | Unit 0 のみ | 直接アクセス |
| DynamoDB Recipes | Unit 1 | Unit 1 のみ | 直接アクセス（他はAPI経由） |
| DynamoDB ConfirmedMenuItems | Unit 2 | Unit 2 のみ | 直接アクセス（他はAPI経由） |
| DynamoDB CharacterDialogues | Unit 4 | Unit 4 のみ | 直接アクセス |
| S3（料理写真） | Unit 1 | Unit 1 のみ | 直接アクセス |
| Amazon Bedrock | — | Unit 1（写真認識）、Unit 4（リアルタイム生成） | AWS SDK |

**原則**: ドメイン間のDB直接アクセスは禁止。各ユニットは自分が所有するテーブルのみ直接アクセスし、他ユニットのデータが必要な場合はAPIリクエストで取得する。
