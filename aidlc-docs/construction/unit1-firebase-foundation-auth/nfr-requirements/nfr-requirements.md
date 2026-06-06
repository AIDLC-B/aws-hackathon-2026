# Unit 1: 非機能要件（NFR）

> コンテキスト: 個人開発 / Firebase無料枠内運用 / 小規模ユーザー想定 / Google認証

## NFR-SEC: セキュリティ（最重要）

| ID | 要件 | 根拠/方針 |
|---|---|---|
| SEC-1 | ユーザーデータは本人のみアクセス可 | Firestore Security Rules: `request.auth.uid == uid` |
| SEC-2 | `isPremium` / `createdAt` はクライアントから変更不可 | フィールドレベル保護（Q2a=A）。更新時にこれらフィールドの変更を拒否。本人は nickname / favoriteCharacters / isOnboardingCompleted のみ更新可 |
| SEC-3 | 未認証アクセスの全面禁止 | Security Rulesで `request.auth != null` を必須化 |
| SEC-4 | 認証はGoogle OAuthに委譲（パスワード非保持） | Firebase Authentication（Google Provider）。アプリはパスワードを扱わない |
| SEC-5 | Googleから取得する情報は最小スコープ | email / displayName / photoURL のみ（Q6=A） |
| SEC-6 | セッショントークンはFirebase Authが管理・自動更新 | アプリはトークンを自前保存しない |

> **Security Baseline拡張準拠**: SEC-2により権限昇格（自己isPremium付与）を防止。SEC-1/3により最小権限・デフォルト拒否を担保。

## NFR-PERF: 性能

| ID | 要件 | 方針 |
|---|---|---|
| PERF-1 | 明示的なSLOは設定しない | Firebaseマネージドの標準性能に委ねる（Q3=A） |
| PERF-2 | 認証状態の初期化中はローディング表示 | UXを損なわない範囲で許容 |

## NFR-AVAIL: 可用性

| ID | 要件 | 方針 |
|---|---|---|
| AVAIL-1 | ベストエフォート | Firebase Auth / Firestore / Hosting のマネージド可用性に依拠（Q5=A） |
| AVAIL-2 | 明示的なバックアップ運用は当面なし | 将来必要時にFirestoreエクスポート等を検討 |

## NFR-SCALE: スケーラビリティ

| ID | 要件 | 方針 |
|---|---|---|
| SCALE-1 | 小規模（個人〜少数）想定 | 無料枠内。スケール施策は現時点で不要 |

## NFR-USABILITY: ユーザビリティ

| ID | 要件 | 方針 |
|---|---|---|
| USE-1 | モバイルファースト + PC対応（レスポンシブ） | Q4=A。モダンブラウザ最新版を対象 |
| USE-2 | ログインはワンタップ（Googleボタンのみ） | フォーム入力なし・離脱率低減 |
| USE-3 | 認証キャンセルはエラー表示しない | popup-closed-by-user 等は静かに戻す（BR-8） |

## NFR-MAINT: 保守性

| ID | 要件 | 方針 |
|---|---|---|
| MAINT-1 | Firestore SDKアクセスは層1プリミティブに集約 | useDocument経由（Unit 3）。テスト容易性・重複排除 |
| MAINT-2 | 認証ロジックはuseAuth/AuthProviderに集約 | 関心の分離 |
| MAINT-3 | テストはFirebase Emulator Suiteで実施 | Security Rulesテストを含む |

## NFR-RELIABILITY: 信頼性

| ID | 要件 | 方針 |
|---|---|---|
| REL-1 | Google認証エラーを分類しユーザーに適切提示 | BR-8のマッピング |
| REL-2 | usersドキュメント作成失敗時のハンドリング | リトライ or エラー表示 |

---

## NFR優先度サマリー

| カテゴリ | 優先度 | 備考 |
|---|---|---|
| セキュリティ | 🔴 最重要 | 認証・認可・フィールドレベル保護 |
| ユーザビリティ | 🟡 重要 | モバイルファースト・ワンタップlog in |
| 保守性 | 🟡 重要 | 層構造・Emulatorテスト |
| 性能/可用性/スケール | 🟢 標準 | 無料枠・ベストエフォート |
