## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 1.2. YAML/JSONファイルハンドラ実装 (utils/file_handler.py)`
* **担当モジュール/ファイル**: `project_anima/utils/file_handler.py` (新規作成)
* **関連する詳細仕様書セクション**: 「詳細仕様書 5. フォルダ構成案」 (utilsディレクトリの役割として)
* **このタスクのゴール**: プロジェクト全体で使用するYAMLファイルおよびJSONファイルの読み込み・書き込みを行う、再利用可能なユーティリティ関数群を実装する。

## 背景と目的 (Background and Purpose)

* キャラクター設定ファイル(YAML)、場面設定ファイル(YAML)、シミュレーションログ(JSON/YAML)など、本プロジェクトでは複数の箇所で設定ファイルやデータファイルのI/Oが発生する。これらの処理を共通化することで、コードの重複を避け、保守性を向上させる。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `load_yaml`, `load_json`: 読み込むファイルのパス (文字列)
    * `save_yaml`, `save_json`: 保存するデータ (Pythonオブジェクト)、保存先ファイルのパス (文字列)
* **処理内容**:
    * 指定されたパスのYAML/JSONファイルを読み込み、Pythonの辞書やリストなどのオブジェクトに変換する。
    * Pythonのオブジェクトを、指定されたパスにYAML/JSON形式で書き出す。
    * ファイル操作に伴う一般的なエラー（ファイルが存在しない、アクセス権限がない、不正なフォーマットなど）を適切にハンドリングする。
* **出力/返り値**:
    * `load_yaml`, `load_json`: 読み込んだデータ (Pythonオブジェクト)
    * `save_yaml`, `save_json`: なし (正常に書き込めた場合はTrueを返す、なども検討可)
* **エラーハンドリング**:
    * `FileNotFoundError`: 読み込み対象のファイルが存在しない場合に発生させる。
    * `PermissionError`: ファイルへのアクセス権限がない場合に発生させる。
    * `yaml.YAMLError` (PyYAMLの場合) / `json.JSONDecodeError`: ファイル内容が不正でパースできない場合に発生させる。
    * その他、書き込み時のI/Oエラーなど。
    * これらのエラーは、呼び出し元で適切に処理できるように、そのままraiseするか、あるいはカスタム例外でラップしてraiseすることを検討する。
* **考慮事項**:
    * 文字エンコーディングは `utf-8` を基本とする。
    * YAML書き込み時には、Pythonのオブジェクトが人間にとって読みやすい形式で出力されるようにする（例: `allow_unicode=True`, `sort_keys=False` など、PyYAMLの `dump` 関数のオプションを適切に設定）。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成するファイル: `project_anima/utils/file_handler.py`
* 作成する関数:
    * `load_yaml(file_path: str) -> Any:`
    * `save_yaml(data: Any, file_path: str) -> None:`
    * `load_json(file_path: str) -> Any:`
    * `save_json(data: Any, file_path: str, indent: Optional[int] = 4) -> None:`
* 必要なインポート: `import yaml`, `import json`, `from typing import Any, Optional`

**2. 実装ロジックの詳細:**

* **`load_yaml(file_path: str) -> Any:`**
    1.  指定された `file_path` を `utf-8` エンコーディングで読み込みモード (`'r'`) で開く。
    2.  `yaml.safe_load()` を使用してファイル内容をPythonオブジェクトに変換して返す。
    3.  `FileNotFoundError`, `yaml.YAMLError` などの例外を適切に処理する (呼び出し元に伝播させるか、ログ出力してNoneを返すなど検討。ここでは呼び出し元に伝播を推奨)。

* **`save_yaml(data: Any, file_path: str) -> None:`**
    1.  指定された `file_path` を `utf-8` エンコーディングで書き込みモード (`'w'`) で開く。
    2.  `yaml.dump()` を使用して `data` をファイルに書き込む。この際、`allow_unicode=True` と `sort_keys=False` をオプションとして指定することを推奨する。
    3.  I/O関連のエラーを適切に処理する。

* **`load_json(file_path: str) -> Any:`**
    1.  指定された `file_path` を `utf-8` エンコーディングで読み込みモード (`'r'`) で開く。
    2.  `json.load()` を使用してファイル内容をPythonオブジェクトに変換して返す。
    3.  `FileNotFoundError`, `json.JSONDecodeError` などの例外を適切に処理する。

* **`save_json(data: Any, file_path: str, indent: Optional[int] = 4) -> None:`**
    1.  指定された `file_path` を `utf-8` エンコーディングで書き込みモード (`'w'`) で開く。
    2.  `json.dump()` を使用して `data` をファイルに書き込む。この際、`ensure_ascii=False` と `indent=indent` (デフォルト4) をオプションとして指定することを推奨する。
    3.  I/O関連のエラーを適切に処理する。

**3. 返り値/出力の詳細:**

* `load_*` 関数は読み込んだPythonオブジェクト。
* `save_*` 関数は返り値なし (`None`)。

**4. エラーハンドリングの詳細:**

* 各関数内で発生しうる `FileNotFoundError`, `PermissionError`, `yaml.YAMLError`, `json.JSONDecodeError` および一般的なI/Oエラーについては、`try-except` ブロックで捕捉せず、呼び出し元で処理できるようにそのままraiseする方針を推奨します。これにより、各関数はファイルI/Oの責務に集中できます。
* 関数のdocstringには、発生しうる例外の種類を明記してください。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全ての関数の引数、返り値に付与してください。
* 各関数にはdocstringを適切な形式 (例: Googleスタイル, reStructuredText) で記述してください（機能、引数、返り値、発生しうる例外など）。
* 主要なロジック部分にはコメントを付してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 正常系テスト

1.  **テストケース1: YAMLファイルの正常な読み込み**
    * **前提条件/入力**: 正しい形式のサンプルYAMLファイル (`sample.yaml`) が存在。
        ```yaml
        # sample.yaml
        name: Project Anima
        version: 0.1.0
        settings:
          debug: true
          port: 8000
        ```
    * **操作手順**: `data = load_yaml('sample.yaml')`
    * **期待される結果**: `data` が `{'name': 'Project Anima', 'version': '0.1.0', 'settings': {'debug': True, 'port': 8000}}` となること。
2.  **テストケース2: PythonオブジェクトのYAMLファイルへの正常な書き込み**
    * **前提条件/入力**: `test_data = {'key': 'value', 'numbers': [1, 2, 3], 'nested': {'a': True}}`
    * **操作手順**: `save_yaml(test_data, 'output.yaml')`
    * **期待される結果**: `output.yaml` が作成され、その内容が `test_data` をYAML形式で表現したものと一致すること（キーの順序は不定で良いが、内容は一致）。`load_yaml('output.yaml')` で読み込んだ結果が `test_data` と一致すること。
3.  **テストケース3: JSONファイルの正常な読み込み** (YAMLと同様のテストケース)
4.  **テストケース4: PythonオブジェクトのJSONファイルへの正常な書き込み** (YAMLと同様のテストケース、indentが適用されていることも確認)

### 異常系テスト

1.  **テストケース1: 存在しないYAMLファイルの読み込み**
    * **前提条件/入力**: 存在しないファイルパス `'non_existent.yaml'`
    * **操作手順**: `try-except FileNotFoundError` で `load_yaml('non_existent.yaml')` を実行
    * **期待される結果**: `FileNotFoundError` が発生すること。
2.  **テストケース2: 不正な形式のYAMLファイルの読み込み**
    * **前提条件/入力**: YAMLとして不正な形式のファイル (`invalid.yaml`) が存在。
        ```yaml
        # invalid.yaml
        name: Test: value_with_unescaped_colon
        ```
    * **操作手順**: `try-except yaml.YAMLError` で `load_yaml('invalid.yaml')` を実行
    * **期待される結果**: `yaml.YAMLError` (またはそのサブクラス) が発生すること。
3.  **テストケース3: 書き込み権限のないパスへのYAMLファイル書き込み**
    * **前提条件/入力**: 書き込み権限のないディレクトリパス (テスト環境で準備)
    * **操作手順**: `try-except PermissionError` で `save_yaml({}, '/readonly_dir/output.yaml')` を実行
    * **期待される結果**: `PermissionError` が発生すること。
4.  **テストケース4, 5, 6**: JSONに関しても同様の異常系テスト (存在しないファイル、不正な形式、書き込み権限なし)

## 完了の定義 (Definition of Done)

* [ ] `project_anima/utils/file_handler.py` に `load_yaml`, `save_yaml`, `load_json`, `save_json` 関数が実装されている。
* [ ] 各関数には適切な型ヒントとdocstringが付与されている。
* [ ] YAMLの書き込み時には、人間が読みやすい形式（ユニコード文字の保持、キーのソートなしなど）で出力される。
* [ ] JSONの書き込み時には、指定されたインデント（デフォルト4）で整形されて出力される。
* [ ] ファイルI/Oに関する主要なエラー（FileNotFoundError, PermissionError, パースエラー等）が適切に処理され、呼び出し元に伝播される。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_file_handler.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* PyYAMLライブラリがインストールされていることを前提とします (`pip install PyYAML`)。
* JSONはPython標準ライブラリの `json` モジュールを使用します。