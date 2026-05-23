# Application Design Plan（Firebase版）

## 概要
Firebaseアーキテクチャに基づくアプリケーション設計計画。
既存のUser Stories・UX設計を維持しつつ、技術スタックをFirebaseに全面移行する。

## 設計方針
- **フロントエンド中心設計**: CRUD操作はフロントエンドからFirestoreに直接アクセス
- **Cloud Functionsは最小限**: Claude API呼び出しのみ
- **Firestore Security Rules**: 認可・データアクセス制御の中心
- **コスト最適化**: Firebase無料枠内で運用可能な設計

## 設計チェックリスト

### Phase 1: コンポーネント設計
- [x] フロントエンドコンポーネント構成（FSD的構成）
- [x] Cloud Functions定義（最小限）
- [x] Firestoreコレクション設計
- [x] Firebase Authentication統合設計

### Phase 2: コンポーネントメソッド定義
- [x] フロントエンドサービス層のメソッド定義
- [x] Cloud Functionsのエンドポイント定義
- [x] Firestoreクエリパターン定義

### Phase 3: サービス層設計
- [x] ドメイン間通信パターン
- [x] Firestoreデータフロー
- [x] Cloud Functions呼び出しフロー
- [x] キャラクタードメインIF設計

### Phase 4: 依存関係設計
- [x] コンポーネント依存関係マトリクス
- [x] データフロー図
- [x] Firestoreコレクション間の参照関係

### Phase 5: 統合設計ドキュメント
- [x] application-design.md（統合ドキュメント）
- [ ] 整合性確認

---

## 設計質問

以下の質問に回答してください。

## Question 1
フロントエンドのコンポーネント設計方針について、前回のFSD（Feature-Sliced Design）的な4階層モデル（Page/Widget/Feature Component/UI Element）を維持しますか？

A) 維持する（前回と同じ4階層モデル）
B) 簡素化する（Page/Component の2階層で十分）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Firestoreのコレクション設計方針について。前回のDynamoDB設計ではドメインごとにテーブルを所有する原則でした。Firestoreでも同様にドメインごとにトップレベルコレクションを分離しますか？

A) ドメインごとにトップレベルコレクションを分離（recipes, confirmedMenuItems, characterDialogues, users）
B) ユーザーをルートとしたサブコレクション構成（users/{uid}/recipes, users/{uid}/confirmedMenuItems）
C) ハイブリッド（ユーザー固有データはサブコレクション、マスターデータはトップレベル）
D) Other (please describe after [Answer]: tag below)

[Answer]: B＋C（ユーザーデータをユーザーをルートとしたサブコレクション構成、マスターデータは別コレクションで格納）

## Question 3
Cloud Functionsの設計方針について。Claude API呼び出し以外にCloud Functionsを使う場面はありますか？

A) Claude API呼び出しのみ（料理写真認識）
B) Claude API呼び出し + ガチャ抽選ロジック（レアリティ確率計算をサーバーサイドで実行）
C) Claude API呼び出し + ガチャ抽選 + 献立提案フィルタリング（ビジネスロジックをサーバーサイドに集約）
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
キャラクター台詞のマスターデータ管理について。前回はDynamoDBのマスターテーブルに格納し、Bedrockで手動生成する方針でした。Firestoreでも同様にマスターデータとして管理しますか？

A) Firestoreのマスターコレクションに格納（前回と同じ方針・Claude APIで手動生成）
B) フロントエンドの静的データとして管理（JSONファイル等・Firestore読み取り回数を節約）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
ガチャの抽選ロジック（レアリティ確率計算）の実行場所について。前回はBE-03（GachaLambda）で実行する方針でした。

A) Cloud Functionsで実行（サーバーサイド・確率操作防止）
B) フロントエンドで実行（コスト削減・Cloud Functions呼び出し回数節約）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
Firestore Security Rulesの設計粒度について。

A) コレクションごとに詳細なルール（読み取り/書き込み/削除を個別制御）
B) 基本ルール（認証済みユーザーは自分のデータのみアクセス可）+ マスターデータは読み取り専用
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
前回のApplication Designで確定したキャラクタードメインのIF設計（trigger/from/isPremiumを渡し、キャラクター・トーン選択は内部で決定）は維持しますか？

A) 維持する（ロジックはフロントエンド内のキャラクターモジュールで実行）
B) 変更したい（具体的に記述してください）
C) Other (please describe after [Answer]: tag below)

[Answer]: A
