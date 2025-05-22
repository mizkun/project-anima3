# Project Anima ユーザーマニュアル

このマニュアルでは、Project Animaの詳細な使用方法について説明します。

## 目次

1. [環境設定](#1-環境設定)
2. [キャラクター設定ファイルの作成](#2-キャラクター設定ファイルの作成)
3. [場面設定ファイルの作成](#3-場面設定ファイルの作成)
4. [シミュレーションの実行](#4-シミュレーションの実行)
5. [ユーザー介入機能](#5-ユーザー介入機能)
6. [長期情報の更新](#6-長期情報の更新)
7. [シミュレーション結果の確認](#7-シミュレーション結果の確認)
8. [トラブルシューティング](#8-トラブルシューティング)

## 1. 環境設定

### APIキーの取得

1. Gemini APIキーの取得方法:
   - [Google AI Studio](https://makersuite.google.com/)にアクセスし、アカウントを作成
   - APIキーを発行（無料枠あり）

2. OpenAI APIキーの取得方法（代替として）:
   - [OpenAI Platform](https://platform.openai.com/)にアクセスし、アカウントを作成
   - APIキーを発行（有料）

### .envファイルの設定

プロジェクトのルートディレクトリに`.env`ファイルを作成し、以下の内容を記述します:

```
# Gemini API キー
GOOGLE_API_KEY=your_api_key_here

# OpenAI API キー（オプション）
OPENAI_API_KEY=your_api_key_here
```

## 2. キャラクター設定ファイルの作成

キャラクター設定は2つのYAMLファイルで定義します:

### 2.1 不変情報 (immutable.yaml)

キャラクターの基本設定を記述します。このファイルは`characters/{character_id}/immutable.yaml`に配置します。

```yaml
character_id: "alice_wonderland"
name: "アリス"
age: 16
gender: "女性"
base_personality: "好奇心旺盛で冒険好き。論理的だが時に衝動的。"
appearance: "金髪のロングヘアに青いドレスを着ている。"
background: "不思議の国への冒険を経験したことがある。現実世界では高校生。"
speaking_style: "丁寧だが時に感情的になる。疑問形での発言が多い。"
traits:
  - "勇敢"
  - "好奇心旺盛"
  - "論理的"
```

### 2.2 長期情報 (long_term.yaml)

キャラクターの経験、目標、記憶などの可変情報を記述します。このファイルは`characters/{character_id}/long_term.yaml`に配置します。

```yaml
character_id: "alice_wonderland"
experiences:
  - event: "不思議の国を冒険した"
    importance: 10
  - event: "白ウサギを追いかけた"
    importance: 8
  - event: "ハートの女王とチェスをした"
    importance: 7
goals:
  - goal: "現実世界でも冒険を見つける"
    importance: 9
  - goal: "論理学を学び、不思議の国のパラドックスを解明する"
    importance: 8
memories:
  - memory: "チェシャ猫との不思議な会話"
    scene_id_of_memory: "wonderland_001"
    related_character_ids: ["cheshire_cat"]
  - memory: "マッドハッターのお茶会"
    scene_id_of_memory: "wonderland_002"
    related_character_ids: ["mad_hatter", "march_hare"]
```

## 3. 場面設定ファイルの作成

場面設定は`scenes/{scene_id}.yaml`ファイルで定義します。

```yaml
scene_id: "high_school_library"
location: "高校の図書館"
time: "放課後"
situation: "放課後の図書館。窓から夕日が差し込み、ほとんどの生徒はすでに帰宅している。木々の影が長く伸び、静かな空間に時折ページをめくる音だけが響いている。"
participant_character_ids:
  - "alice_wonderland"
  - "bob_mathematician"
```

## 4. シミュレーションの実行

### 基本的な実行方法

```bash
# デフォルト設定（scenes/school_rooftop.yaml、最大3ターン）
python main.py

# 場面設定ファイルを指定
python main.py --scene scenes/high_school_library.yaml

# ターン数を指定
python main.py --max-turns 5

# 使用するLLMモデルを指定
python main.py --llm-model gemini-1.5-pro
```

### コマンドラインオプション一覧

| オプション | 説明 | デフォルト値 |
|-----------|------|-------------|
| `--scene` | 場面設定ファイルのパス | scenes/school_rooftop.yaml |
| `--characters-dir` | キャラクターディレクトリのパス | characters |
| `--prompts-dir` | プロンプトテンプレートディレクトリのパス | prompts |
| `--max-turns` | 実行するターン数 | 3 |
| `--debug` | デバッグモードを有効にする | False |
| `--llm-model` | 使用するLLMモデル | gemini-1.5-flash-latest |

## 5. ユーザー介入機能

現在、Project Animaでは以下のユーザー介入機能を実装しています。これらは、シミュレーションエンジン内で`process_user_intervention`メソッドを通じて提供されます。

### 5.1 場面状況の更新

場面の状況説明を変更できます。例えば、「突然雨が降り始める」など、環境の変化をシミュレーションに導入できます。

実装例（APIとして使用する場合）:
```python
from core.data_models import InterventionData, SceneUpdateDetails

# 場面状況更新の介入データを作成
intervention = InterventionData(
    applied_before_turn_number=next_turn_number,
    intervention_type="SCENE_SITUATION_UPDATE",
    intervention=SceneUpdateDetails(
        description="天候の変化",
        updated_situation_element="突然、空が暗くなり、雨が降り始めた。"
    )
)

# シミュレーションエンジンに介入を渡す
engine.process_user_intervention(intervention)
```

### 5.2 キャラクターへの天啓付与

特定のキャラクターに「天啓」（秘密の情報や閃き）を与えることができます。これにより、キャラクターの行動に影響を与えられます。

実装例:
```python
from core.data_models import InterventionData, RevelationDetails

# 天啓付与の介入データを作成
intervention = InterventionData(
    applied_before_turn_number=next_turn_number,
    intervention_type="REVELATION",
    target_character_id="alice_wonderland",
    intervention=RevelationDetails(
        description="秘密の情報",
        revelation_content="図書館の奥の本棚に隠し扉があることに気づいた。"
    )
)

# シミュレーションエンジンに介入を渡す
engine.process_user_intervention(intervention)
```

### 5.3 キャラクターの追加/削除

シミュレーション実行中に、場面にキャラクターを追加したり、削除したりできます。

実装例（キャラクター追加）:
```python
from core.data_models import InterventionData, GenericInterventionDetails

# キャラクター追加の介入データを作成
intervention = InterventionData(
    applied_before_turn_number=next_turn_number,
    intervention_type="ADD_CHARACTER_TO_SCENE",
    intervention=GenericInterventionDetails(
        description="新しいキャラクターが登場",
        extra_data={"character_id_to_add": "charlie_scientist"}
    )
)

# シミュレーションエンジンに介入を渡す
engine.process_user_intervention(intervention)
```

### 5.4 場面終了

現在のシミュレーションを終了し、ログを保存します。

実装例:
```python
from core.data_models import InterventionData, GenericInterventionDetails

# 場面終了の介入データを作成
intervention = InterventionData(
    applied_before_turn_number=next_turn_number,
    intervention_type="END_SCENE",
    intervention=GenericInterventionDetails(
        description="場面を終了する",
        extra_data={}
    )
)

# シミュレーションエンジンに介入を渡す
engine.process_user_intervention(intervention)
```

## 6. 長期情報の更新

シミュレーション実行後、キャラクターの長期情報（経験、目標、記憶）を更新できます。この機能は、キャラクターの成長や変化を表現するために重要です。

実装例:
```python
# キャラクターの長期情報を更新
update_proposal = engine.update_character_long_term_info("alice_wonderland")

# 更新内容を表示
print("更新提案:", update_proposal)
```

長期情報の更新は、以下のプロセスで行われます:

1. 現在の場面ログからキャラクターの行動や経験を分析
2. LLMを使用して、長期情報の更新提案を生成
3. 更新提案に基づいて、キャラクターの長期情報ファイル (long_term.yaml) を更新

## 7. シミュレーション結果の確認

シミュレーション結果は`logs/sim_{timestamp}/scene_{scene_id}.json`に保存されます。

### 7.1 ログファイルの構造

```json
{
  "scene_info": {
    "scene_id": "high_school_library",
    "location": "高校の図書館",
    "time": "放課後",
    "situation": "放課後の図書館。窓から夕日が差し込み...",
    "participant_character_ids": ["alice_wonderland", "bob_mathematician"]
  },
  "interventions_in_scene": [
    {
      "applied_before_turn_number": 2,
      "intervention_type": "SCENE_SITUATION_UPDATE",
      "intervention": {
        "description": "天候の変化",
        "updated_situation_element": "突然、空が暗くなり、雨が降り始めた。"
      }
    }
  ],
  "turns": [
    {
      "turn_number": 1,
      "character_id": "alice_wonderland",
      "character_name": "アリス",
      "think": "図書館は静かだな。何か面白い本を探してみよう。",
      "act": "本棚に近づいて、タイトルを眺める。",
      "talk": "どんな本を読もうかしら...冒険物語が読みたい気分。"
    },
    {
      "turn_number": 2,
      "character_id": "bob_mathematician",
      "character_name": "ボブ",
      "think": "数学の問題を解いていたけど、雨の音が気になる。",
      "act": "窓の方を見る。",
      "talk": "雨が降り始めたね。傘持ってきた？"
    }
  ]
}
```

### 7.2 ログの解析

シミュレーションログは、小説や物語の素材として利用できます。例えば:

- 各キャラクターの思考（think）を内的独白として使用
- 行動（act）と発言（talk）を基に、シーンを描写
- 介入（interventions_in_scene）を物語の転換点として活用

## 8. トラブルシューティング

### 8.1 APIキー関連の問題

**症状**: `GOOGLE_API_KEY environment variable not set`というエラーが表示される

**解決策**:
- `.env`ファイルがプロジェクトルートに存在するか確認
- APIキーが正しく設定されているか確認
- 環境変数が読み込まれているか確認: `python -c "import os; print(os.environ.get('GOOGLE_API_KEY'))"`

### 8.2 キャラクターや場面ファイルが見つからない

**症状**: `Character file not found` や `Scene file not found` というエラーが表示される

**解決策**:
- ファイルパスが正しいか確認
- YAMLファイルの構文が正しいか確認
- 必要なディレクトリ構造が存在するか確認

### 8.3 LLM API呼び出しエラー

**症状**: `LLMGenerationError` や API関連のエラーが表示される

**解決策**:
- インターネット接続を確認
- APIキーの有効性と使用量制限を確認
- LLMモデル名が正しいか確認（`--llm-model`オプションで指定）
- リクエストが大きすぎないか確認（コンテキスト長の制限）

### 8.4 パフォーマンスの問題

**症状**: シミュレーションの実行が遅い

**解決策**:
- ターン数を減らす（`--max-turns`オプション）
- より応答速度の速いLLMモデルを使用
- デバッグログを無効にする（`--debug`オプションを外す） 