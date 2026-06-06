# Unit 1: 論理コンポーネント

> NFRパターンを担う論理コンポーネントとその連携。インフラ的な重量コンポーネント（キャッシュ/キュー/サーキットブレーカー）は無料枠・小規模のため不要。

## 論理コンポーネント一覧

| コンポーネント | 種別 | 責務 | 担うパターン |
|---|---|---|---|
| AuthProvider | React Context | 認証状態（currentUser/profile/loading）の保持・提供。onAuthStateChange監視・ローカル永続化設定 | UP-1, SP-1 |
| useAuth | カスタムフック | signInWithGoogle / signOut。usersドキュメントの冪等初期化 | RP-3, MP-1 |
| authErrorMapper | ユーティリティ | Firebase Authエラーコード→日本語メッセージ変換。キャンセル系は無視 | RP-2 |
| Firestore Security Rules | ルール定義 | フィールドレベル認可・デフォルト拒否 | SP-2, SP-3 |
| Cloud Storage Security Rules | ルール定義 | recipe-images/{uid}本人限定（Unit 5で利用・ルール本体はUnit 1所有） | SP-3 |
| RouteGuard | ルーティング | 認証状態と isOnboardingCompleted による表示制御・ローディングゲート | UP-1 |

> 注: useAuthはCRUD 2層の例外として認証SDK（Firebase Auth）を直接利用するが、usersドキュメントのCRUDは層1プリミティブ（useDocument）経由とする。

---

## コンポーネント連携図

```
[App]
  └─ <AuthProvider>                         … 認証状態Context (UP-1, SP-1)
       │  ├─ onAuthStateChanged 監視
       │  ├─ setPersistence(local)
       │  └─ profile = useDocument(users/{uid}) で取得
       │
       ├─ <RouteGuard>                       … 表示制御 (UP-1)
       │     ├─ loading → LoadingSpinner
       │     ├─ 未認証 → LoginPage
       │     ├─ 認証済 & !onboarding → /onboarding
       │     └─ 認証済 & onboarding → /
       │
       └─ [LoginPage] → useAuth.signInWithGoogle()
              ├─ signInWithPopup(Google)      … Auth SDK (SP-1)
              ├─ getDoc(users/{uid})          … 存在確認 (RP-3)
              ├─ なければ setDoc(初期値)       … 冪等初期化 (RP-3)
              ├─ 失敗 → authErrorMapper        … エラー分類 (RP-2)
              └─ 成功 → AuthProvider更新

[Firestore Security Rules]                    … フィールドレベル認可 (SP-2/3)
  └─ users/{uid}: 本人read/write・isPremium/createdAt不変・未認証拒否
```

---

## Security Rules 論理設計（Unit 1所有・全コレクション分の骨子）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.isPremium == false;
      allow update: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.isPremium == resource.data.isPremium
                    && request.resource.data.createdAt == resource.data.createdAt;
      // サブコレクション(recipes/confirmedMenuItems)はUnit5/6で追記
    }
    // マスターコレクション(characterDialogues/difficultyMaster/rarityMaster/gachaConfig)は
    // 該当ユニットで追記（読み取り専用・Application Designの方針に従う）
  }
}
```

> 上記は Unit 1 が所有する `users` のルール骨子。他コレクションのルールは各ユニットで追記し、最終的に `firestore.rules` に統合する。

---

## テスト対象コンポーネント（MP-2）

| テスト | 対象 | ケース |
|---|---|---|
| Rules単体テスト | Firestore Security Rules | 本人read/write許可・他人拒否・isPremium改ざん拒否・create時isPremium=true拒否・未認証拒否 |
| フック単体テスト | useAuth / authErrorMapper | サインイン成功時の初期化・エラーコード→メッセージ変換・キャンセル無視 |
| コンポーネントテスト | RouteGuard | loading/未認証/認証済×onboarding分岐 |

> インフラ的な論理コンポーネント（キャッシュ/キュー/サーキットブレーカー/オートスケール）は本ユニットでは不要（Firebaseマネージド・小規模）。
