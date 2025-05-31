# feat: ディレクトリ構造の整理とリファクタリング

## Issue概要
現在のプロジェクトのディレクトリ構造を整理し、より保守性の高い構造に変更する。

## 背景・目的
- 現在のルートディレクトリにファイルが散らばっており、プロジェクトの見通しが悪い
- 機能別にディレクトリが整理されていないため、開発効率が低下している
- 将来的な機能拡張を考慮した、スケーラブルな構造が必要

## 提案する新しいディレクトリ構造

```
project-anima/
├── src/                          # ソースコード
│   └── project_anima/            # 現在のproject_anima/を移動
│       ├── core/
│       ├── cli.py
│       └── interactive_cli.py
├── data/                         # データファイル（現状維持）
│   ├── characters/
│   ├── scenes/
│   └── prompts/
├── config/                       # 設定ファイル
│   ├── settings.yaml             # デフォルト設定
│   └── .env.example
├── tools/                        # 開発・管理ツール
│   ├── data_validator.py         # YAML検証ツール
│   └── prompt_tester.py          # プロンプトテストツール
├── tests/
├── docs/
├── logs/
├── examples/                     # サンプルデータ
├── scripts/                      # 実行スクリプト
│   ├── run_simulation.py         # 現在のmain.py
│   └── run_interactive.py        # 現在のinteractive.py
├── requirements.txt
├── pyproject.toml
├── setup.py
└── README.md
```

## 実装計画

### Phase 1: ディレクトリ作成と移動
1. 新しいディレクトリ構造を作成
2. 既存ファイルを適切な場所に移動
3. インポートパスの更新

### Phase 2: 設定ファイルの整理
1. `config/settings.yaml`の作成
2. デフォルト設定の集約
3. 環境変数設定の整理

### Phase 3: スクリプトの整理
1. `main.py` → `scripts/run_simulation.py`
2. `interactive.py` → `scripts/run_interactive.py`
3. 実行方法の更新

### Phase 4: ドキュメント更新
1. README.mdの更新
2. パス変更に伴うドキュメント修正

## 完了条件
- [x] 新しいディレクトリ構造が作成されている
- [x] 全ての既存ファイルが適切な場所に移動されている
- [x] インポートパスが正しく更新されている
- [x] 既存の機能が正常に動作する
- [x] ドキュメントが更新されている
- [x] テストが全て通る

## 備考
- 移行中は既存の機能を壊さないよう注意する
- 段階的に移行し、各段階でテストを実行する
- 移行後は古いファイルを削除する前に動作確認を行う 

## 完了報告
**完了日時**: 2024年12月25日
**実装結果**: 
- ディレクトリ構造の整理を完了
- src/project_anima/にソースコードを移動
- scripts/にメインスクリプトを移動  
- data/にデータファイルを統合
- テストファイルのインポートパスを更新
- READMEの実行方法を更新
- 基本テストとスクリプトの動作確認完了
- GitHubにプッシュ完了 