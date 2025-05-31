## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 1.1. データクラス定義 (Pydantic等)`
* **担当モジュール/ファイル**: `project_anima/core/data_models.py` (新規作成)
* **関連する詳細仕様書セクション**: 「3.2.2. コンテクスト管理」, 「4.1. データ構造」
* **このタスクのゴール**: 詳細仕様書で定義されたキャラクター情報、場面情報、ログ情報などのデータ構造に対応するPythonのデータクラスをPydanticを用いて定義し、型安全性とバリデーションを確保する。

## 背景と目的 (Background and Purpose)

* シミュレーションで扱うキャラクター情報、場面情報、ログ情報などをプログラム上で型安全に扱うための基盤となるデータモデルを定義する。これにより、開発効率の向上とバグの低減を目指す。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**: なし (データクラスの定義そのもの)
* **処理内容**:
    * `ImmutableCharacterData` データクラスの定義 (不変のキャラクター情報)
    * `ExperienceData` データクラスの定義 (キャラクターの経験)
    * `GoalData` データクラスの定義 (キャラクターの目標/願望)
    * `MemoryData` データクラスの定義 (キャラクターの記憶)
    * `LongTermCharacterData` データクラスの定義 (上記Experience, Goal, Memoryを含むキャラクターの長期情報)
    * `SceneInfoData` データクラスの定義 (場面情報)
    * `InterventionDetailData` データクラスの定義 (ユーザー介入の詳細情報。内容は介入タイプにより可変)
    * `InterventionData` データクラスの定義 (ユーザー介入の記録)
    * `TurnData` データクラスの定義 (1ターンの記録)
    * `SceneLogData` データクラスの定義 (1場面の全ログ。SceneInfo, Interventions, Turnsを含む)
* **出力/返り値**: 定義されたPydanticモデル群。
* **エラーハンドリング**: Pydanticによるバリデーションエラーは、これらのモデルを利用する側で適切に処理されることを想定。このタスクではモデル定義に集中する。
* **考慮事項**:
    * 詳細仕様書「3.2.2. コンテクスト管理」に記載されたYAML/JSONの構造と完全に一致するようにフィールド名と型を定義すること。
    * 将来的な拡張性も考慮し、フィールドの追加や変更が比較的容易な構造を意識すること。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成するファイル: `project_anima/core/data_models.py`
* 作成する主なPydanticモデルクラス (詳細は下記参照):
    * `ImmutableCharacterData(BaseModel)`
    * `ExperienceData(BaseModel)`
    * `GoalData(BaseModel)`
    * `MemoryData(BaseModel)`
    * `LongTermCharacterData(BaseModel)`
    * `SceneInfoData(BaseModel)`
    * `InterventionDetailData(BaseModel)` (または`Dict[str, Any]`)
    * `InterventionData(BaseModel)`
    * `TurnData(BaseModel)`
    * `SceneLogData(BaseModel)`
* 必要なインポート: `from typing import List, Optional, Dict, Any`, `from pydantic import BaseModel, Field`

**2. 実装ロジックの詳細 (各クラスのフィールド定義):**

* **`ImmutableCharacterData`**:
    * `character_id: str = Field(description="システムが割り当てる一意のID")`
    * `name: str = Field(description="キャラ名")`
    * `age: Optional[int] = Field(None, description="年齢")`
    * `occupation: Optional[str] = Field(None, description="職業")`
    * `base_personality: str = Field(description="基本的な性格特性の記述")`
    * (その他、詳細仕様書に基づき必要な不変情報を追加)

* **`ExperienceData`**:
    * `event: str = Field(description="過去の重要な経験")`
    * `importance: int = Field(ge=1, le=10, description="重要度 (1-10段階)")`

* **`GoalData`**:
    * `goal: str = Field(description="達成したい目標/願望")`
    * `importance: int = Field(ge=1, le=10, description="重要度 (1-10段階)")`

* **`MemoryData`**:
    * `memory: str = Field(description="特定の記憶")`
    * `scene_id_of_memory: str = Field(description="記憶が発生した場面のScene_ID")`
    * `related_character_ids: List[str] = Field(default_factory=list, description="関連キャラクターのIDリスト")`

* **`LongTermCharacterData`**:
    * `character_id: str = Field(description="対応する不変情報と同じID")`
    * `experiences: List[ExperienceData] = Field(default_factory=list)`
    * `goals: List[GoalData] = Field(default_factory=list)`
    * `memories: List[MemoryData] = Field(default_factory=list)`

* **`SceneInfoData`**:
    * `scene_id: str = Field(description="各場面を識別するID")`
    * `location: Optional[str] = Field(None, description="場所")`
    * `time: Optional[str] = Field(None, description="時間")`
    * `situation: str = Field(description="場面の状況説明")`
    * `participant_character_ids: List[str] = Field(description="参加キャラクターのIDリスト")`
    * `previous_scene_log_reference: Optional[str] = Field(None, description="直前場面のログファイル名など、短期情報を引き継ぐ場合の手がかり (オプション)")`

* **`InterventionDetailData`**:
    * これは介入タイプによって内容が大きく変わるため、ひとまず `Dict[str, Any]` もしくは `Any` として定義するか、代表的な介入タイプごとのモデルを別途定義することを検討してください。ここでは汎用性のため `Dict[str, Any]` を推奨します。
    * `description: Optional[str] = None` (共通で持たせる可能性のあるフィールド)
    * (その他、介入タイプに応じたフィールド。例: `updated_situation_element: Optional[str] = None`, `target_character_id: Optional[str] = None`, `revelation_content: Optional[str] = None`)

* **`InterventionData`**:
    * `applied_before_turn_number: int = Field(description="どのターンの前に適用されたか")`
    * `intervention_type: str = Field(description="介入の種類 (例: SCENE_SITUATION_UPDATE, REVELATION)")`
    * `details: InterventionDetailData` (または `Dict[str, Any]`)

* **`TurnData`**:
    * `turn_number: int = Field(description="ターン番号")`
    * `character_id: str = Field(description="行動したキャラクターのID")`
    * `character_name: str = Field(description="行動したキャラクターの名前 (ログの可読性のため)")`
    * `think: str = Field(description="キャラクターの思考内容")`
    * `act: Optional[str] = Field(None, description="キャラクターの行動内容 (行動しない場合はNone)")`
    * `talk: Optional[str] = Field(None, description="キャラクターの発言内容 (発言しない場合はNone)")`

* **`SceneLogData`**:
    * `scene_info: SceneInfoData`
    * `interventions_in_scene: List[InterventionData] = Field(default_factory=list)`
    * `turns: List[TurnData] = Field(default_factory=list)`

**3. 返り値/出力の詳細:**

* このタスクでは、上記PydanticモデルのPythonファイル (`.py`) が生成されることが出力です。

**4. エラーハンドリングの詳細:**

* Pydanticモデルの定義自体には、明示的な `try-except` は通常不要です。バリデーションはPydanticが自動で行います。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのフィールド、メソッドの引数、返り値に付与してください。
* 各クラス、および主要なフィールドにはdocstringを記述してください（フィールドの説明、型、例など）。
* Pydanticの `Field` を使用して、descriptionやデフォルト値、バリデーション（例: `ge=1, le=10`）を適切に設定してください。
* 必要に応じて `Optional` や `default_factory=list` などを活用してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 正常系テスト

1.  **テストケース1: `ImmutableCharacterData` の正常なインスタンス化**
    * **前提条件/入力**: `{"character_id": "c001", "name": "アリス", "base_personality": "好奇心旺盛"}`
    * **操作手順**: `ImmutableCharacterData(**input_data)`
    * **期待される結果**: エラーなくインスタンスが生成され、各フィールドに正しい値が設定されていること。
2.  **テストケース2: `LongTermCharacterData` のネストされたリストを含む正常なインスタンス化**
    * **前提条件/入力**: 詳細仕様書3.2.2の `long_term.yaml` のような構造のデータ
    * **操作手順**: `LongTermCharacterData(**input_data)`
    * **期待される結果**: エラーなくインスタンスが生成され、`experiences`, `goals`, `memories` がそれぞれ `ExperienceData`, `GoalData`, `MemoryData` のリストとして正しくインスタンス化されていること。
3.  **テストケース3: `SceneLogData` の完全なインスタンス化**
    * **前提条件/入力**: 詳細仕様書3.2.2のログファイル構造のようなデータ
    * **操作手順**: `SceneLogData(**input_data)`
    * **期待される結果**: エラーなくインスタンスが生成され、`scene_info`, `interventions_in_scene`, `turns` がそれぞれのデータクラスのインスタンス（またはそのリスト）として正しく設定されていること。
4.  **テストケース4: オプショナルなフィールドがNoneの場合のインスタンス化**
    * **前提条件/入力**: `ImmutableCharacterData` で `age` や `occupation` を含まないデータ
    * **操作手順**: `ImmutableCharacterData(character_id="c002", name="ボブ", base_personality="冷静沈着")`
    * **期待される結果**: エラーなくインスタンスが生成され、`age` と `occupation` が `None` であること。

### 異常系テスト

1.  **テストケース1: `ImmutableCharacterData` の必須フィールド欠損**
    * **前提条件/入力**: `{"name": "アリス", "base_personality": "好奇心旺盛"}` (`character_id` が欠損)
    * **操作手順**: `try-except` で `ImmutableCharacterData(**input_data)` を実行
    * **期待される結果**: Pydanticの `ValidationError` が発生すること。
2.  **テストケース2: `ExperienceData` の `importance` が範囲外**
    * **前提条件/入力**: `{"event": "テストイベント", "importance": 11}`
    * **操作手順**: `try-except` で `ExperienceData(**input_data)` を実行
    * **期待される結果**: Pydanticの `ValidationError` が発生すること。
3.  **テストケース3: `LongTermCharacterData` のリスト要素の型不正**
    * **前提条件/入力**: `experiences` リストの中に `ExperienceData` ではない型のデータ（例: 文字列）が含まれている。
    * **操作手順**: `try-except` で `LongTermCharacterData(**input_data)` を実行
    * **期待される結果**: Pydanticの `ValidationError` が発生すること。

## 完了の定義 (Definition of Done)

* [ ] 詳細仕様書3.2.2および4.1で定義された主要なデータ構造に対応するPydanticモデルが `project_anima/core/data_models.py` に定義されている。
* [ ] 各モデルには適切な型ヒントとdocstringが付与されている。
* [ ] Pydanticの `Field` を用いて、description、デフォルト値、および基本的なバリデーション（数値範囲など）が設定されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_data_models.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* `InterventionDetailData` の具体的なフィールドは、今後の介入機能の詳細化に伴い、より具体的な型やモデルに分割・変更される可能性がありますが、現時点では `Dict[str, Any]` または共通フィールドを持つ基底クラスと具体的な介入タイプごとの派生クラスといった設計も考えられます。まずは柔軟性を持たせた形で定義してください。