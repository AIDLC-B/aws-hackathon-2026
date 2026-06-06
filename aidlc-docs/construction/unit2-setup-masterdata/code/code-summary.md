# Unit 2: コード生成 概要（セットアップ／マスターデータ）

> 生成物は `setup/` フォルダ（独立管理）に配置。

## 生成ファイル一覧

| ファイル | 内容 |
|---|---|
| `setup/SETUP.md` | インストレーションガイド（Firebase作成・Google認証有効化・Rulesデプロイ・seed実行・環境変数） |
| `setup/seed/data/difficulty-master.json` | 難易度マスター（easy/normal/hard） |
| `setup/seed/data/rarity-master.json` | レアリティマスター（N/R/SR/SSR） |
| `setup/seed/data/gacha-config.json` | ガチャ確率（N0.6/R0.25/SR0.12/SSR0.03） |
| `setup/seed/data/character-dialogues.json` | キャラクターセリフ（無料36 + プレミアム14 = 50件） |
| `setup/seed/seed.ts` | 投入スクリプト（firebase-admin・Emulator/本番切替・冪等） |
| `setup/seed/package.json` / `tsconfig.json` | seed実行環境（tsx） |

## マスターデータ内容

### difficultyMaster / rarityMaster / gachaConfig
- ドキュメントIDは識別子（easy, N 等）。冪等な `set` で投入

### characterDialogues
- **分量（Q2a=A）**: 各 trigger × キャラ に2パターン
- **プレミアム（Q5a=A）**: 各キャラに数パターンずつ isPremium=true を追加（chefreiはプレミアムのみ登場）
- スキーマ: `{ characterId, trigger, tone, message, isPremium }` + 投入時 `createdAt`
- trigger×キャラ×トーンの対応は Application Design（services.md）に準拠

| trigger | 登場キャラ（無料） |
|---|---|
| meal_decided | sabokachan, sabowrashi, nyamake, sabot |
| gacha_decided | saboeru, sabokachan, sabowrashi |
| meal_completed | sabokachan, sabowrashi, saboeru |
| recipe_registered | sabokachan, sabowrashi, saboeru |
| meal_suggested | nyamake, sabot, saboeru, sabokachan |
| gacha_reroll_limit | meshistopheles（固定） |

## 投入仕様
- **対象切替（Q3=A）**: `FIRESTORE_EMULATOR_HOST` 設定時はEmulator、未設定+認証情報ありで本番
- **実行（Q4=A）**: `cd setup/seed && npm install && npm run seed`（tsx）
- **冪等性**: マスター3種はID指定setで上書き。characterDialoguesは既存削除→再投入（自動ID）

## 設計整合
- スキーマはApplication Design（components.md）と一致
- Security Rules（Unit 1/将来追記）でマスターは読み取り専用・投入はAdmin SDK（seed）

## TODO（将来）
- characterDialogues をClaude APIで大量生成・拡充（現状は手動スターター）
- マスターコレクションのSecurity Rules本体を firestore.rules に追記（読み取り専用）— Unit 3/8連携時に統合
