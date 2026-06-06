# Unit 1: NFR 設計パターン

> NFR要件を実現する設計パターン。個人開発・無料枠・Google認証前提。

## セキュリティパターン

### SP-1: 認証委譲（OAuth Delegation）
- Google OAuth に認証を委譲。アプリはパスワードを保持しない
- Firebase Auth がトークン発行・自動更新を担当
- 対応NFR: SEC-4, SEC-6

### SP-2: フィールドレベル認可（Field-level Authorization）
- Firestore Security Rules で `users/{uid}` の更新時に `isPremium` / `createdAt` の不変性を強制
- 作成時は `isPremium == false` を強制
- 本人は nickname / favoriteCharacters / isOnboardingCompleted のみ変更可
- 対応NFR: SEC-1, SEC-2（権限昇格防止）

### SP-3: デフォルト拒否（Deny by Default）
- 未認証（`request.auth == null`）は全データ拒否
- 定義外パスは拒否
- 対応NFR: SEC-3

### SP-4: 最小スコープ（Least Privilege Scope）
- Googleスコープは email / displayName / photoURL のみ
- 対応NFR: SEC-5

## レジリエンスパターン

### RP-1: フェイルファスト + ユーザー通知（Q2=A）
- usersドキュメント作成失敗時は自動リトライせず、エラーメッセージを表示して再ログインを促す
- 過剰なリトライによる無料枠消費を回避
- 対応NFR: REL-2

### RP-2: エラー分類マッパー（Error Classification）
- Google認証エラー（popup-closed / cancelled / network / popup-blocked / その他）を日本語メッセージへマッピング
- キャンセル系（popup-closed-by-user / cancelled-popup-request）はエラー表示せず静かに戻す
- 対応NFR: REL-1, USE-3

### RP-3: 冪等な初期化（Idempotent Init・Q1=A）
- 初回サインイン時に `getDoc` で存在確認 → 無ければ `setDoc`
- 2回目以降は上書きせず読み込みのみ → 再サインインしても初期値で上書きされない
- 対応NFR: 整合性

## UX/ユーザビリティパターン

### UP-1: ローディングゲート（Loading Gate）
- 認証状態の初期化（onAuthStateChanged + profile取得）完了まではローディング表示し、画面のちらつき/誤遷移を防止
- 対応NFR: PERF-2, USE-1

### UP-2: ワンタップ認証（One-tap Auth）
- ログインはGoogleボタンのみ。フォーム入力ゼロで離脱を抑制
- 対応NFR: USE-2

### UP-3: レスポンシブ（Mobile-first Responsive）
- モバイルファーストでレイアウトし、PCにも対応
- 対応NFR: USE-1

## 保守性／テストパターン

### MP-1: データアクセス集約（Repository via Primitives）
- Firestoreアクセスは層1プリミティブ（useDocument）経由。useAuthはSDKを直接呼ばない（ただしAuth SDKは認証特性上useAuth内で利用）
- 対応NFR: MAINT-1, MAINT-2

### MP-2: Rules単体テスト（Q3=A）
- Firebase Emulator上でSecurity Rulesの主要ケースを自動検証
  - 本人による読み書き → 許可
  - 他人のドキュメントアクセス → 拒否
  - 本人による isPremium 改ざん（update） → 拒否
  - 作成時 isPremium=true → 拒否
  - 未認証アクセス → 拒否
- 対応NFR: MAINT-3, SEC-2

---

## NFR × パターン対応表

| NFR | パターン |
|---|---|
| SEC-1/2 | SP-2, MP-2 |
| SEC-3 | SP-3 |
| SEC-4/6 | SP-1 |
| SEC-5 | SP-4 |
| REL-1 | RP-2 |
| REL-2 | RP-1 |
| PERF-2 | UP-1 |
| USE-1/2/3 | UP-1, UP-2, UP-3 |
| MAINT-1/2/3 | MP-1, MP-2 |
