# ユニット依存関係（Firebase版）

> **注**: 旧AWS版を全面刷新。Firebaseアーキテクチャ（Cloud Functions + Firestore + Cloud Storage + Firebase Auth）に基づく依存関係。

## 依存関係マトリクス

| 依存元 ↓ / 依存先 → | U1 基盤&認証 | U2 セットアップ/マスター | U3 共有基盤 | U4 Functions | U5 料理管理 | U6 献立提案 | U7 ガチャ | U8 キャラ |
|---|---|---|---|---|---|---|---|---|
| **U1 基盤&認証** | — | — | △ firebase.ts連携 | — | — | — | — | — |
| **U2 セットアップ/マスター** | ✅ project/Rules | — | — | — | — | — | — | — |
| **U3 共有基盤** | ✅ firebase init | ⏱ 実行時:マスター読取 | — | — | — | — | — | — |
| **U4 Functions** | ✅ project/Firestore | ⏱ 実行時:gachaConfig | — | — | — | — | — | — |
| **U5 料理管理** | ✅ 認証 | — | ✅ プリミティブ/型 | ✅ CF-01 | — | — | — | ⏱ 一言表示 |
| **U6 献立提案** | ✅ 認証 | — | ✅ プリミティブ/型 | ✅ CF-02 | ✅ レシピ参照 | — | — | ⏱ 一言表示 |
| **U7 ガチャ** | ✅ 認証 | — | ✅ プリミティブ/型 | ✅ CF-03 | ✅ レシピ参照 | ✅ 確定済み献立 | — | ⏱ 一言表示 |
| **U8 キャラ** | ✅ 認証 | ✅ dialogues | ✅ プリミティブ/型 | — | — | — | — | — |

凡例: ✅ ビルド/実装依存 / ⏱ 実行時データ依存 / △ 軽微な連携

---

## 依存関係図

```
Unit 1: Firebase基盤 & 認証 ──────────── (全ユニットの前提)
   │
   ├── Unit 2: セットアップ／マスターデータ (project/Rules前提)
   │
   ├── Unit 3: 共有基盤 (firebase init前提・実行時マスター読取)
   │      │
   │      ├── Unit 4: Cloud Functions (project前提・実行時gachaConfig)
   │      │
   │      ├── Unit 5: 料理管理 ── CF-01(U4) ── 一言(U8)
   │      │        │
   │      │        └── Unit 6: 献立提案 ── CF-02(U4) ── 一言(U8)
   │      │                 │
   │      │                 └── Unit 7: 献立ガチャ ── CF-03(U4) ── 一言(U8)
   │      │
   │      └── Unit 8: AIキャラクター ── dialogues(U2)
   │
   └── (Unit 8 は Unit 5/6/7 から一言表示として消費される)
```

---

## 実装順序（確定・Q6=A 推奨順）

```
Phase 1: Unit 1（Firebase基盤 & 認証）
    ↓
Phase 2: Unit 2（セットアップ／マスターデータ）
    ↓
Phase 3: Unit 3（共有基盤）
    ↓
Phase 4: Unit 4（Cloud Functions）
    ↓
Phase 5: Unit 5（料理管理）
    ↓
Phase 6: Unit 6（献立提案）
    ↓
Phase 7: Unit 7（献立ガチャ）
    ↓
Phase 8: Unit 8（AIキャラクター）
```

---

## キャラクター一言の横断的依存（重要）

Unit 5/6/7 は機能完了時にキャラクター一言（CharacterBottomSheet / CharacterInline）を表示するため、Unit 8 のキャラクターモジュールに依存する。一方 Unit 8 は実装順序上で最後となる。この前後関係を以下で解決する。

- **インターフェース先行定義**: `useCharacterDialogue` の入出力型・`CharacterBottomSheet` のpropsを **Unit 3（共有基盤）の types** で先行定義
- **段階的統合**: Unit 5/6/7 はインターフェースに対して実装し、一言表示部分はプレースホルダ（最小スタブ）で先行可能
- **最終結線**: Unit 8 完了時に本実装（マスターからの選択・トーン決定）へ差し替え

---

## 通信方式

| 通信パターン | 方式 | 例 |
|---|---|---|
| FE → Firestore | Firebase SDK直接（層1プリミティブ経由） | レシピ/確定済み献立/設定のCRUD |
| FE → Cloud Storage | Firebase SDK直接 | 料理写真アップロード・読み取り |
| FE → Cloud Functions | Callable Functions（Auth Token自動付与） | CF-01/02/03呼び出し |
| FE → Firebase Auth | Firebase Auth SDK | サインアップ・ログイン |
| Functions → Firestore | Admin SDK | CF-02/03のデータ取得 |
| Functions → Claude API | HTTPS（Secret Managerでキー管理） | CF-01認識・CF-03関連 |
| seed → Firestore | Admin SDK | マスターデータ投入（Unit 2） |

---

## 共有リソース

| リソース | 所有ユニット | 利用ユニット | アクセス方式 |
|---|---|---|---|
| Firebase Auth | Unit 1 | 全ユニット | Auth SDK / Callable自動検証 |
| Firestore Security Rules | Unit 1 | 全ユニット | ルール適用 |
| Cloud Storage Security Rules | Unit 1 | Unit 5 | ルール適用 |
| 汎用プリミティブ（useCollection/useDocument） | Unit 3 | Unit 5/6/7/8 | import |
| useMasterData / MasterDataProvider | Unit 3 | Unit 5/6/7（表示） | Context |
| 共通型定義（shared/types） | Unit 3 | 全機能ユニット | import |
| users/{uid}/recipes | — | Unit 5（CRUD）、Unit 4 CF-02/03（読取） | Firestore直接 / Admin SDK |
| users/{uid}/confirmedMenuItems | — | Unit 6（CRUD）、Unit 7（書込）、Unit 4 CF-02/03（読取） | Firestore直接 / Admin SDK |
| characterDialogues（マスター） | Unit 2（投入） | Unit 8（読取） | Firestore直接（読取専用） |
| difficultyMaster / rarityMaster（マスター） | Unit 2（投入） | Unit 3 MasterDataProvider（読取） | Firestore直接（読取専用） |
| gachaConfig（マスター） | Unit 2（投入） | Unit 4 CF-03（読取） | Admin SDK |
| Cloud Storage（料理写真） | Unit 1（Rules）/ Unit 5（利用） | Unit 5 | Firebase SDK直接 |

**原則**:
- ユーザーデータ（recipes/confirmedMenuItems）は本人のみアクセス（Security Rules）。Cloud FunctionsはAdmin SDKでバイパス
- マスターデータは読み取り専用、投入はseed（Admin SDK）のみ
- フロントエンドのFirestore/Storage直接アクセスは層1プリミティブ（Unit 3）に集約
