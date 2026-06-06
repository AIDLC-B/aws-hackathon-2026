# Unit 1: Firebase基盤 & 認証 — Code Generation 計画

> 本計画はUnit 1コード生成の単一の真実（Single Source of Truth）。承認後、ステップ順に実行する。

## ユニットコンテキスト

- **対象**: Unit 1（Firebase基盤 & 認証）
- **実装ストーリー**: US-17（Googleログイン/登録）、US-18（ログアウト・処理部分。設定画面UIはUnit 8）
- **プロジェクト種別**: Greenfield / モノレポ / コードは**ワークスペースルート**に配置（aidlc-docs/には置かない）
- **所有データ**: `users/{uid}` ドキュメント
- **依存**: なし（最初の基盤ユニット）。ただしUnit 3（共有プリミティブ）は未実装

### 依存に関する方針（ブートストラップ）
- Unit 1はプロジェクトの土台を作る最初のユニット
- `useAuth` の usersドキュメントアクセスは、Unit 3のプリミティブ（useDocument）が未実装のため**当面は直接Firestore（getDoc/setDoc）で実装**
- Unit 3完成後に層1プリミティブ経由へリファクタ（NFR Design MP-1の最終形）。本計画ではこのブートストラップを許容

## コード配置（ワークスペースルート）

```
/
├── index.html
├── package.json / tsconfig.json / vite.config.ts / .env.example
├── firebase.json / firestore.rules / storage.rules / firestore.indexes.json
├── .github/workflows/deploy.yml
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx              # RouteGuard含む
│   │   └── providers/AuthProvider.tsx
│   ├── features/auth/
│   │   ├── pages/LoginPage.tsx
│   │   ├── components/GoogleSignInButton.tsx
│   │   └── hooks/useAuth.ts
│   └── shared/
│       ├── lib/firebase.ts          # Firebase初期化（Auth/Firestore/Storage）
│       ├── types/index.ts           # UserProfile等（Unit3で拡張）
│       └── utils/authErrorMapper.ts
└── tests/
    ├── unit/useAuth.test.ts
    ├── unit/authErrorMapper.test.ts
    ├── unit/RouteGuard.test.tsx
    └── rules/firestore.rules.test.ts   # Emulator Rules単体テスト
```

---

## 生成ステップ

- [x] **Step 1: プロジェクト構造セットアップ（greenfield）**
  - package.json（React+TS+Vite, firebase, react-router, vitest, @testing-library, @firebase/rules-unit-testing）
  - tsconfig.json / vite.config.ts / index.html / src/main.tsx / .env.example / .gitignore

- [x] **Step 2: Firebase初期化・共通型（shared）**
  - src/shared/lib/firebase.ts（initializeApp + Auth/Firestore/Storage、Emulator接続切替、browserLocalPersistence）
  - src/shared/types/index.ts（UserProfile型・最小。Unit 3で拡張）

- [x] **Step 3: ビジネスロジック生成（認証）**
  - src/shared/utils/authErrorMapper.ts（BR-8マッピング・RP-2）
  - src/features/auth/hooks/useAuth.ts（signInWithGoogle / signOut / 冪等初期化 RP-3・直接Firestore）
  - src/app/providers/AuthProvider.tsx（onAuthStateChanged監視・profile取得・Context提供）

- [x] **Step 4: ビジネスロジック単体テスト**
  - tests/unit/authErrorMapper.test.ts
  - tests/unit/useAuth.test.ts（Emulator/モック）

- [x] **Step 5: フロントエンドコンポーネント生成**
  - src/features/auth/components/GoogleSignInButton.tsx（data-testid付与）
  - src/features/auth/pages/LoginPage.tsx（ロゴ+ボタン+エラー表示・レスポンシブ）
  - src/app/routes.tsx（RouteGuard: loading/未認証/onboarding分岐 UP-1）
  - src/app/App.tsx（Provider/Router組み立て）

- [x] **Step 6: フロントエンド単体テスト**
  - tests/unit/RouteGuard.test.tsx（分岐検証）

- [x] **Step 7: Security Rules 生成**
  - firestore.rules（users: 本人read/write・isPremium/createdAt不変・create時isPremium=false・デフォルト拒否 SP-2/3）
  - storage.rules（recipe-images/{uid} 本人限定・5MB・image/*）
  - firestore.indexes.json（Unit 1は空/最小）

- [x] **Step 8: Security Rules 単体テスト**
  - tests/rules/firestore.rules.test.ts（本人許可/他人拒否/isPremium改ざん拒否/create時isPremium=true拒否/未認証拒否 MP-2）

- [x] **Step 9: Firebase構成・デプロイ成果物**
  - firebase.json（hosting/firestore/storage/functions/emulators）
  - .github/workflows/deploy.yml（lint→test[Emulator]→build→deploy）

- [x] **Step 10: ドキュメント生成**
  - aidlc-docs/construction/unit1-firebase-foundation-auth/code/ にコード概要・セットアップ補足（markdown）
  - README.md（プロジェクト起動・Emulator・デプロイ手順の雛形）

- [x] **Step 11: 整合性確認**
  - 設計（functional/nfr/infra）との突き合わせ・ストーリーUS-17/18カバレッジ確認

---

## ストーリートレーサビリティ

| ストーリー | 実装ステップ |
|---|---|
| US-17（Googleログイン/登録） | Step 2,3,5,7（firebase/useAuth/AuthProvider/LoginPage/Rules） |
| US-18（ログアウト処理） | Step 3（useAuth.signOut）。設定画面UIはUnit 8 |

## テスト方針
- 生成段階ではコード+テストを作成。**テスト実行は Build & Test フェーズ**（全ユニット完了後）
- Rules単体テストはFirebase Emulator前提

## 補足
- UIには `data-testid` を付与（自動テスト容易化）
- Claude APIキー等の秘匿情報はコードに含めない（Functions実装はUnit 4）

---

**この計画で進めてよろしいですか？** 承認いただければ Part 2（生成）を Step 1 から実行します。
