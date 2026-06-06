# Unit 1: コード生成 概要

> 生成コードはワークスペースルートに配置（本ドキュメントは概要のみ）。

## 生成ファイル一覧

### プロジェクト基盤（Step 1）
| ファイル | 内容 |
|---|---|
| `package.json` | React+TS+Vite+Firebase+Vitest等 |
| `tsconfig.json` / `vite.config.ts` | TS/Vite設定（@エイリアス・vitest設定） |
| `index.html` / `src/main.tsx` | エントリポイント |
| `.env.example` / `.gitignore` | 環境変数雛形・除外設定 |
| `eslint.config.js` | ESLint flat config |
| `tests/setup.ts` | テストセットアップ |

### Firebase初期化・型（Step 2）
| ファイル | 内容 |
|---|---|
| `src/shared/lib/firebase.ts` | Firebase初期化・Emulator接続・ローカル永続化・GoogleProvider |
| `src/shared/types/index.ts` | UserProfile型 |

### ビジネスロジック（Step 3）
| ファイル | 内容 |
|---|---|
| `src/shared/utils/authErrorMapper.ts` | 認証エラー→日本語メッセージ（BR-8/RP-2） |
| `src/features/auth/hooks/useAuth.ts` | signInWithGoogle / signOut / 冪等初期化（BR-2/RP-3） |
| `src/app/providers/AuthProvider.tsx` | 認証状態Context（L-3/UP-1） |

### フロントエンド（Step 5）
| ファイル | 内容 |
|---|---|
| `src/features/auth/components/GoogleSignInButton.tsx` | Googleログインボタン（data-testid付） |
| `src/features/auth/pages/LoginPage.tsx` | ログイン画面（US-17） |
| `src/app/routes.tsx` | RouteGuard（L-5）+ ルーティング（onboarding/home はプレースホルダ） |
| `src/app/App.tsx` | Provider/Router組み立て |

### Security Rules（Step 7）
| ファイル | 内容 |
|---|---|
| `firestore.rules` | users本人限定・isPremium/createdAt不変・デフォルト拒否 |
| `storage.rules` | recipe-images本人限定・5MB・image/* |
| `firestore.indexes.json` | 空（Unit 1は不要） |

### 構成・CI（Step 9）
| ファイル | 内容 |
|---|---|
| `firebase.json` | Hosting/Firestore/Storage/Functions/Emulator |
| `.github/workflows/deploy.yml` | CI/CD（lint→test[Emulator]→build→deploy） |

### テスト（Step 4/6/8）
| ファイル | 内容 |
|---|---|
| `tests/unit/authErrorMapper.test.ts` | エラーマッピング |
| `tests/unit/useAuth.test.ts` | ensureUserProfile冪等性 |
| `tests/unit/RouteGuard.test.tsx` | 認証ガード分岐 |
| `tests/rules/firestore.rules.test.ts` | Security Rules（本人/他人/isPremium改ざん/未認証） |

### ドキュメント（Step 10）
| ファイル | 内容 |
|---|---|
| `README.md` | セットアップ・Emulator・テスト・デプロイ手順 |

## ストーリーカバレッジ
- US-17（Googleログイン/登録）: ✅ LoginPage / useAuth / AuthProvider / firestore.rules
- US-18（ログアウト処理）: ✅ useAuth.signOut（設定画面UIはUnit 8）

## 既知の方針・TODO
- `useAuth` のusersアクセスは直接Firestore（ブートストラップ）。Unit 3完成後にuseDocumentプリミティブへリファクタ
- onboarding/home画面はプレースホルダ（Unit 5/6で実装）
- ログアウトの確認Modal/設定画面UIはUnit 8（useAuth.signOutは提供済み）
- テスト実行は Build & Test フェーズ（全ユニット完了後）
