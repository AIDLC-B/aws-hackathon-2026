# Application Design 計画

## 実行チェックリスト

- [ ] Step 1: コンポーネント定義（components.md）→ [x] 完了
- [ ] Step 2: コンポーネントメソッド定義（component-methods.md）→ [x] 完了
- [ ] Step 3: サービス層定義（services.md）→ [x] 完了
- [ ] Step 4: コンポーネント依存関係定義（component-dependency.md）→ [x] 完了
- [ ] Step 5: 統合ドキュメント作成（application-design.md）→ [x] 完了
- [ ] Step 6: 整合性検証 → [x] 完了

---

## 既知の設計情報（User Stories・UX設計から）

### ドメイン構成（確定済み）
| ドメイン | 対応FR | 主な責務 |
|---|---|---|
| 料理管理ドメイン | FR-00, FR-01 | 料理登録・レパートリー管理・検索API提供 |
| 献立提案ドメイン | FR-02 | フィルタリングロジック・3品選択・ガチャ誘導判定 |
| ガチャドメイン | FR-05 | ガチャ演出・レアリティ抽選・リセマラ管理 |
| キャラクタードメイン | FR-03, FR-06 | 一言生成・トーン選択・Bedrock連携（内部隠蔽） |
| 認証ドメイン | — | Cognito認証・セッション管理 |

### キャラクタードメインIF（確定済み）
- 呼び出し元は `trigger` + `from` のみ渡す
- キャラクター選択・トーン選択・Bedrock呼び出しは内部隠蔽

### フロントエンド（確定済み）
- React + TypeScript（レスポンシブ）
- ボトムナビゲーション（ホーム・レシピ・設定）
- フロントエンドを結合レイヤーとして各ドメインAPIを呼び出す

---

## 質問ファイル

質問は `aidlc-docs/inception/plans/application-design-questions.md` を参照してください。

---

## 承認状態
- [ ] 質問への回答完了
- [ ] 計画承認済み
- [ ] 設計生成完了
