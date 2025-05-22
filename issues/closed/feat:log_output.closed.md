## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 3.3. ログ出力機能 (core/simulation_engine.py, utils/file_handler.py)`
* **担当モジュール/ファイル**: `project_anima/core/simulation_engine.py` (既存ファイルに追記), `project_anima/utils/file_handler.py` (既存ファイルに追記の可能性あり)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 2.1. システム構成案 (データ入出力モジュール, ログ出力モジュール)」
    * 「詳細仕様書 3.2.2. コンテクスト管理 (短期情報 (ログファイル構造))」
    * 「詳細仕様書 4.2. ファイル形式と入出力 (出力)」
    * 「詳細仕様書 5. フォルダ構成案 (logs/ ディレクトリ)」
    * 「詳細仕様書 5.1. `core/` ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）」
* **このタスクのゴール**: `SimulationEngine` の `_save_scene_log` メソッドを本格的に実装し、場面終了時にメモリ上の場面ログデータ (`SceneLogData` インスタンス) を、指定されたJSONまたはYAML形式でファイルに出力する機能を完成させる。

## 背景と目的 (Background and Purpose)

* シミュレーションの各ターンの詳細な記録（キャラクターの思考、行動、発言、ユーザー介入など）は、物語生成の素材として、またデバッグや分析のための重要な情報源となる。
* このタスクでは、シミュレーションエンジンが場面ごとに生成したログデータを、永続的なファイルとして保存する機能を実装する。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `_save_scene_log` メソッド: (引数なし、`self._current_scene_log` を使用)
* **処理内容**:
    1.  `SimulationEngine` の `_save_scene_log` メソッドを実装する。
    2.  まず、`self._current_scene_log` が存在するか確認する。存在しない場合はログに警告を出力して終了。
    3.  出力先のディレクトリパスを決定する。詳細仕様書では `logs/<simulation_id>/` となっているが、このタスクではまず `logs/` ディレクトリ直下に保存する形で良い。`<simulation_id>` の導入は将来的な拡張とするか、あるいは現在時刻などから簡易的なIDを生成しても良い。ここでは、`logs/` ディレクトリに直接 `scene_<scene_id>.json` (または `.yaml`) というファイル名で保存する方針とする。
    4.  出力先の `logs/` ディレクトリが存在しない場合は作成する (`os.makedirs(..., exist_ok=True)` を使用)。
    5.  `self._current_scene_log` (これは `SceneLogData` のインスタンス) をJSONまたはYAML形式の文字列に変換する。
        * `SceneLogData` はPydanticモデルなので、`.model_dump_json(indent=2)` (JSONの場合) や、`.model_dump()` で辞書に変換してから `file_handler.save_yaml` (YAMLの場合) を使用できる。
    6.  タスク1.2で実装した `file_handler.save_json` または `file_handler.save_yaml` 関数を使って、変換したデータをファイルに書き出す。ファイル形式は、当面JSONをデフォルトとするか、設定で切り替えられるようにするか検討する (このタスクではJSONをデフォルトとする)。
* **出力/返り値**:
    * `_save_scene_log`: なし (ファイルが生成される)。
* **エラーハンドリング**:
    * ファイル書き込み時のI/Oエラー (`PermissionError`, `OSError` など) を適切にキャッチし、ログに出力する。シミュレーション全体の停止までは不要だが、エラーが発生したことは記録する。
* **考慮事項**:
    * 出力ファイル名には、詳細仕様書通り `Scene_ID` を含める。
    * 大量のログデータを扱う場合のパフォーマンス（今回は考慮外で良い）。
    * ログファイルのフォーマット（JSONかYAMLか）は、現状JSONを優先するが、将来的には設定可能にすることも視野に入れる。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 編集するファイル1: `project_anima/core/simulation_engine.py`
    * 編集するメソッド: `_save_scene_log(self) -> None`
* 編集するファイル2 (必要に応じて): `project_anima/utils/file_handler.py`
    * (もし `save_json` や `save_yaml` にPydanticモデルを直接渡せるような拡張や、ディレクトリ作成機能が不足していれば追記。ただし、タスク1.2で `os.makedirs` は `save_yaml` と `save_json` に追加済みのはずなので、大きな変更は不要と思われる。)
* 必要なインポート (`simulation_engine.py`):
    ```python
    import os
    import logging
    # from .data_models import SceneLogData (既にTYPE_CHECKINGブロックにあるはず)
    from ..utils.file_handler import save_json # (または save_yaml)
    ```

**2. 実装ロジックの詳細 (`SimulationEngine._save_scene_log`):**

1.  `if self._current_scene_log is None or self._current_scene_log.scene_info is None:`
    * `logger.warning("保存すべき場面ログが存在しません。")`
    * `return`
2.  `scene_id = self._current_scene_log.scene_info.scene_id`
3.  `log_directory = "logs"` # 固定のログディレクトリ名
4.  `file_name = f"scene_{scene_id}.json"` # 出力ファイル名 (JSON形式をデフォルトとする)
5.  `output_file_path = os.path.join(log_directory, file_name)`
6.  `try:`
    * `os.makedirs(log_directory, exist_ok=True)`
    * `log_data_dict = self._current_scene_log.model_dump()` # Pydanticモデルを辞書に変換
    * `save_json(log_data_dict, output_file_path, indent=2)` # file_handlerの関数を使用 (indent=2で見やすく)
    * `logger.info(f"場面ログをファイルに保存しました: {output_file_path}")`
7.  `except PermissionError as e:`
    * `logger.error(f"ログファイルへの書き込み権限がありません: {output_file_path}. Error: {e}")`
8.  `except Exception as e: # その他のI/Oエラーなど`
    * `logger.error(f"ログファイルの保存中に予期せぬエラーが発生しました: {output_file_path}. Error: {e}")`

**3. 返り値/出力の詳細:**

* `_save_scene_log` は返り値なし (`None`)。指定されたパスにログファイルが生成される。

**4. エラーハンドリングの詳細:**

* 上記「実装ロジックの詳細」の `try-except` ブロックを参照。ファイル書き込みに関する一般的なエラーを捕捉し、ログに出力する。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのメソッドの引数、返り値に付与してください。
* 各メソッドにはdocstringを適切な形式で記述してください。
* `file_handler.py` の `save_json` が `indent=2` をデフォルトでサポートしているか確認し、そうでなければ `indent` パラメータを渡せるようにする (タスク1.2のIssueでは `indent: Optional[int] = 4` となっていたので、`indent=2` を明示的に渡す)。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトとテストデータ準備
* `SimulationEngine` のインスタンスを生成できるように、必要なモック (`CharacterManager` など) やテストデータ (`SceneInfoData` を含む `SceneLogData` のダミーインスタンス) を準備する。
* `utils.file_handler.save_json` (または `save_yaml`) が正しく呼び出されることを確認するために、これをモックすることも検討する。あるいは、実際にファイルが生成されることを確認する。
* テスト実行後に生成されるログファイルをクリーンアップする処理をテストの `tearDown` などで用意する。

### 正常系テスト

1.  **テストケース1: 正常な場面ログがJSONファイルとして保存される**
    * **前提条件/入力**: `SimulationEngine` が初期化され、`_current_scene_log` に有効な `SceneLogData` (例: `scene_id="S001"`, いくつかのダミーターンデータを含む) が設定されている。`logs/` ディレクトリは存在しなくても良い。
    * **操作手順**: `engine._save_scene_log()` を実行。
    * **期待される結果**:
        * `logs/` ディレクトリが作成されること (もし存在しなければ)。
        * `logs/scene_S001.json` ファイルが生成されること。
        * 生成されたJSONファイルの内容が、`_current_scene_log` の内容をJSONシリアライズしたものと一致すること (Pydanticの `.model_dump_json(indent=2)` の結果と一致)。
        * 適切な成功ログが出力されること。
2.  **テストケース2: `_current_scene_log` が `None` の場合に警告ログが出て何もされない**
    * **前提条件/入力**: `SimulationEngine` が初期化され、`_current_scene_log` が `None`。
    * **操作手順**: `engine._save_scene_log()` を実行。
    * **期待される結果**: 警告ログが出力され、ファイルは生成されないこと。

### 異常系テスト

1.  **テストケース1: ログディレクトリへの書き込み権限がない場合**
    * **前提条件/入力**: `logs/` ディレクトリが書き込み不可の状態で (テスト環境でシミュレート)、`_current_scene_log` に有効なデータがある。
    * **操作手順**: `engine._save_scene_log()` を実行。
    * **期待される結果**: エラーログが出力され、ファイルは生成されないこと (`PermissionError` がキャッチされる)。
2.  **テストケース2: `save_json` で予期せぬI/Oエラーが発生した場合**
    * **前提条件/入力**: `utils.file_handler.save_json` が `OSError` などを発生させるようにモック。`_current_scene_log` に有効なデータがある。
    * **操作手順**: `engine._save_scene_log()` を実行。
    * **期待される結果**: エラーログが出力され、ファイルは生成されないこと。

## 完了の定義 (Definition of Done)

* [ ] `SimulationEngine._save_scene_log` メソッドが実装され、現在の場面ログ (`SceneLogData`) をJSONファイルとして `logs/scene_<scene_id>.json` に保存する。
* [ ] 出力先の `logs/` ディレクトリが存在しない場合は自動的に作成される。
* [ ] PydanticモデルのデータをJSONにシリアライズする際には、人間が読みやすいようにインデントが適用される (例: `indent=2`)。
* [ ] ファイル書き込み時の一般的なI/Oエラーが適切に処理され、ログに出力される。
* [ ] メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_simulation_engine.py` の一部として、またはファイルI/O専用のテストで）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクでは、ログファイルの出力形式はJSONをデフォルトとします。YAML形式での出力オプションは将来的な拡張とします。
* `<simulation_id>` のような実行ごとのサブディレクトリ作成は、このタスクの範囲外とし、まずは `logs/` 直下に保存します。
* `file_handler.py` の `save_json` が `indent` パラメータを正しく処理できることを再確認してください。