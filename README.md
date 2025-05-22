# Project Anima

AIキャラクターシミュレーター

## 概要

Project Animaは、ユーザーが定義したAIキャラクターたちが、与えられたコンテクストに基づいて自律的に思考し、行動・発言する様子をシミュレートするシステムです。シミュレーション結果はテキストファイルとして出力され、ユーザーはこれを小説、シナリオ等のエンターテイメントコンテンツ制作の素材として活用することを目的としています。

## 主な機能

- キャラクター定義：YAMLファイルで不変情報と長期情報を定義
- 場面設定：YAMLファイルで場面の状況、場所、時間、参加キャラクターを定義
- 思考生成：LLM（Gemini/OpenAI）を用いたキャラクターの思考・行動・発言の生成
- ユーザー介入：シミュレーション中に場面状況の変更、キャラクターへの天啓付与などが可能
- 長期情報更新：シミュレーション後にキャラクターの記憶や目標などの長期情報を更新

## 技術スタック

- Python 3.9+
- Pydantic：データ構造の定義・検証
- LangGraph：LLM処理フロー制御
- PyYAML：設定ファイルの読み込み
- Google Generative AI / OpenAI API：LLMサービス連携

## インストール方法

### 前提条件

- Python 3.9以上
- pip（Pythonパッケージマネージャー）
- 仮想環境（venv, conda等）
- Gemini API キー または OpenAI API キー

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/project-anima.git
cd project-anima
```

### 2. 仮想環境の作成と有効化

```bash
# venvを使用する場合
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. 依存パッケージのインストール

```bash
# 開発モードでインストール
pip install -e .

# または依存パッケージのみをインストール
pip install -r requirements.txt
```

### 4. API キーの設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の内容を記述します：

```
# Gemini API キー
GOOGLE_API_KEY=your_api_key_here

# OpenAI API キー（必要な場合）
OPENAI_API_KEY=your_api_key_here
```

## 使用方法

### 基本的な実行方法

```bash
# デフォルト設定で実行（school_rooftop.yamlを使用、最大3ターン）
python main.py

# 場面設定ファイルを指定して実行
python main.py --scene scenes/your_scene.yaml

# ターン数を指定して実行
python main.py --max-turns 5

# 使用するLLMモデルを指定
python main.py --llm-model gemini-1.5-pro
```

### コマンドラインオプション

- `--scene`: 場面設定ファイルのパス（デフォルト: scenes/school_rooftop.yaml）
- `--characters-dir`: キャラクター設定ファイルが格納されているディレクトリ（デフォルト: characters）
- `--prompts-dir`: プロンプトテンプレートが格納されているディレクトリ（デフォルト: prompts）
- `--max-turns`: 実行するターン数（デフォルト: 3）
- `--debug`: デバッグモードを有効にする
- `--llm-model`: 使用するLLMモデル名（デフォルト: gemini-1.5-flash-latest）

### キャラクター設定ファイルの作成

キャラクター設定は以下の2つのYAMLファイルで定義します：

1. `characters/{character_id}/immutable.yaml`：不変情報（名前、年齢、性格など）
2. `characters/{character_id}/long_term.yaml`：長期情報（経験、目標、記憶など）

詳細なフォーマットは `characters/` ディレクトリ内のサンプルを参照してください。

### 場面設定ファイルの作成

場面設定は `scenes/{scene_id}.yaml` ファイルで定義します。詳細なフォーマットは `scenes/` ディレクトリ内のサンプルを参照してください。

### シミュレーション結果の確認

シミュレーション結果は `logs/sim_{timestamp}/scene_{scene_id}.json` に保存されます。

## 開発ガイド

### テストの実行

```bash
# すべてのテストを実行
python run_tests.py

# 特定のテストファイルを実行
python -m pytest tests/test_file_name.py

# 特定のテストケースを実行
python -m pytest tests/test_file_name.py::test_function_name
```

### コードフォーマット

コードのフォーマットには Black を使用しています。以下のコマンドで一括フォーマットできます：

```bash
black .
```

## プロジェクト構造

```
project-anima/
├── characters/           # キャラクター設定ファイル
├── core/                 # コア機能実装
│   ├── character_manager.py  # キャラクター管理
│   ├── context_builder.py    # コンテキスト構築
│   ├── data_models.py        # データモデル定義
│   ├── information_updater.py # 情報更新処理
│   ├── llm_adapter.py        # LLM連携
│   ├── scene_manager.py      # 場面管理
│   └── simulation_engine.py  # シミュレーションエンジン
├── docs/                 # ドキュメント
├── issues/               # 課題管理
├── logs/                 # シミュレーションログ
├── prompts/              # プロンプトテンプレート
├── scenes/               # 場面設定ファイル
├── tests/                # テストコード
├── utils/                # ユーティリティ
├── main.py               # エントリーポイント
├── requirements.txt      # 依存パッケージリスト
└── README.md             # このファイル
```

## 貢献方法

1. このリポジトリをフォークします
2. 新しいブランチを作成します (`git checkout -b feature/amazing-feature`)
3. 変更をコミットします (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュします (`git push origin feature/amazing-feature`)
5. プルリクエストを作成します

## ライセンス

MIT License 