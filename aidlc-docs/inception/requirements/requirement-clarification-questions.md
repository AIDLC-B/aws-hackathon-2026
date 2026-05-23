# Firebase移行 追加確認質問

回答内容にいくつか確認・明確化が必要な点がありました。

## 矛盾検出 1: セキュリティ適用 × フロントエンド直接Firestore操作

Q5で「フロントエンドで直接Firestore操作」を選択し、Security Extensionを「適用」としています。
フロントエンドからの直接Firestore操作は、Firestore Security Rulesで保護しますが、Claude APIキーの管理にはCloud Functionsが必須です（フロントエンドにAPIキーを露出させるのはセキュリティ違反）。

### Clarification Question 1
Claude API呼び出し（料理写真認識・キャラクター台詞生成）のアーキテクチャはどうしますか？

A) Cloud Functions経由でClaude APIを呼び出す（APIキーはサーバーサイドで管理）
B) Firebase Extensions等のプロキシ経由で呼び出す
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## 明確化 2: コンテキスト変更に伴うスコープ確認

ハッカソン向けPoCから「最小限コストでの実装」に変更されました。これにより、MVPスコープの優先度が変わる可能性があります。

### Clarification Question 2
「最小限のコスト」の意味として最も近いものはどれですか？

A) 金銭的コスト最小化（Firebase無料枠内で収まるように設計、Claude API呼び出し回数も最小限）
B) 開発工数最小化（機能は全部作るが、最も効率的な実装方法を選ぶ）
C) 両方（金銭的コストも開発工数も最小化、必要に応じて機能を削減）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Clarification Question 3
MVPスコープの優先度に変更はありますか？（現在のMust機能: FR-00〜FR-03, FR-05シングルガチャ）

A) 変更なし（全Must機能を実装）
B) さらに絞りたい（具体的にどの機能を残すか記述してください）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Clarification Question 4
「ハッカソンには落ちた」ことで、デモ・審査員向けの演出要素（ユーモア・ガチャ演出の派手さ等）の優先度はどうなりますか？

A) 変更なし（ユーモア・演出要素はそのまま維持、自分が使いたいアプリとして作る）
B) 演出要素は簡素化（機能は残すが、アニメーション等は最小限に）
C) 演出要素は大幅削減（コア機能のみに集中）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Clarification Question 5
成功基準を更新する必要があります。新しい成功基準として適切なものはどれですか？

A) 自分が日常的に使えるアプリとして完成させる（実用性重視）
B) ポートフォリオ・技術デモとして完成させる（技術力アピール重視）
C) 両方（実用的かつ技術的に見栄えのするアプリ）
D) Other (please describe after [Answer]: tag below)

[Answer]: A
