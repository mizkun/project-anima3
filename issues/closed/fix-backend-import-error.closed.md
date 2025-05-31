## 1. Issue種別 (Issue Type)

* [x] バグ修正 (Bug Fix)
* [ ] 機能改善 (Enhancement)
* [ ] 新規機能 (New Feature)
* [ ] リファクタリング (Refactoring)
* [ ] ドキュメント (Documentation)
* [ ] その他 (Other: {{specify}})

## 2. 優先度 (Priority)

* [x] 高 (High)
* [ ] 中 (Medium)
* [ ] 低 (Low)

## 3. タイトル (Title)

バックエンドサーバーのインポートエラー修正

## 4. 問題の概要 (Problem Overview)

FastAPIバックエンドサーバーが起動できない。インポートパスの問題により `ModuleNotFoundError` が発生し、シミュレーション機能が全く利用できない状態。フロントエンドからAPIサーバーへの接続が失敗し、アプリケーションが正常に動作しない。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現在のweb版実装
* **関連する詳細仕様書セクション**: web/backend モジュール
* **関連するタスクリスト番号**: N/A

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

1. プロジェクトルートから `cd web/backend && python main.py` を実行
2. または `python -m uvicorn main:app --reload` を実行
3. `ModuleNotFoundError: No module named 'api'` または `ModuleNotFoundError: No module named 'web'` が発生
4. サーバーが起動せず、フロントエンドからAPIへの接続が失敗

## 7. 期待される動作 (Expected Behavior)

* バックエンドサーバーが正常に起動する
* ポート8000でFastAPIサーバーがアクセス可能になる
* フロントエンドからAPI呼び出しが成功する
* シミュレーション機能が正常に動作する

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

* `ModuleNotFoundError: No module named 'api'` エラーが発生
* `ModuleNotFoundError: No module named 'web'` エラーが発生 
* サーバー起動に失敗
* フロントエンドで proxy error が大量に発生
* アプリケーション全体が機能しない

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * `web/backend/main.py` のインポート文
    * `web/backend/api/simulation.py` のインポート文
    * プロジェクト構造とPythonパッケージ設定
* **特定された原因 (仮説を含む)**:
    1. **相対インポートの問題**: `main.py`で`from api import ...`を使用しているが、作業ディレクトリによってはモジュールが見つからない
    2. **パッケージ実行の問題**: `python main.py`で直接実行しているため、Pythonパッケージとして認識されない
    3. **モジュールパス解決の問題**: PYTHONPATHの設定とプロジェクト構造の不整合
* **関連するログ/エラーメッセージ**:
    ```
    ModuleNotFoundError: No module named 'api'
    ModuleNotFoundError: No module named 'web'
    ImportError: attempted relative import beyond top-level package
    ```

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    * インポートパスを絶対パスに統一
    * プロジェクトルートからのモジュール実行方式に変更
    * パッケージ構造を適切に認識させる
* **具体的な変更点**:
    1. `main.py`のインポート文を絶対パスに変更
    2. `api/simulation.py`などのモジュール内インポートも絶対パスに統一
    3. サーバー起動方法をプロジェクトルートから`python -m web.backend.main`形式に変更
    4. 必要に応じて`__init__.py`ファイルの追加・更新
* **代替案 (あれば)**:
    * PYTHONPATHを設定する方法もあるが、プロジェクト配布時の問題を避けるため、絶対インポートが推奨

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1. **[ ] main.pyのインポート修正**:
    * **変更対象ファイル**: `web/backend/main.py`
    * **変更対象クラス/関数**: importセクション
    * **具体的な変更内容**: `from api import ...` → `from web.backend.api import ...`
2. **[ ] APIモジュールのインポート修正**:
    * **変更対象ファイル**: `web/backend/api/simulation.py`
    * **変更対象クラス/関数**: importセクション  
    * **具体的な変更内容**: `from ..services.engine_wrapper import ...` → `from web.backend.services.engine_wrapper import ...`
3. **[ ] 他のAPIファイルの修正**:
    * **変更対象ファイル**: `web/backend/api/files.py`, `web/backend/api/export.py`
    * **具体的な変更内容**: 相対インポートを絶対インポートに変更
4. **[ ] サービスモジュールの修正**:
    * **変更対象ファイル**: `web/backend/services/` 配下のファイル
    * **具体的な変更内容**: インポートパスの修正
5. **[ ] 起動スクリプトまたはドキュメントの更新**:
    * **変更対象ファイル**: README.mdまたは起動用スクリプト
    * **具体的な変更内容**: 正しい起動方法の記載

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **ユニットテスト**:
    * インポートが正常に動作することの確認
    * 各APIエンドポイントが正常にインポートされることの確認
* **結合テスト/手動テスト**:
    1. プロジェクトルートから `python -m web.backend.main` でサーバー起動
    2. `http://localhost:8000/docs` でAPIドキュメントにアクセス可能
    3. `http://localhost:8000/api/health` でヘルスチェック成功
    4. フロントエンドから基本的なAPI呼び出しが成功

---

## 13. 完了の定義 (Definition of Done)

* [x] 上記「提案される解決策/改善案」が実装されている。
* [x] 上記「実装計画/タスク分割」の全てのサブタスクが完了している。
* [x] 上記「テスト計画」に記載された全てのテストが成功する。
* [x] コードがリファクタリングされ、可読性が維持/向上している (該当する場合)。
* [x] Pythonの型ヒントが付与されている。
* [x] docstringと適切なコメントが記述されている。
* [x] (自己レビュー) コードに明らかなバグや非効率な箇所がない。
* [ ] (美希様によるレビュー) 修正内容と実装が承認される。

## 14. 備考 (Notes)

* **解決済み**: `python web/backend/run_server.py` で正常起動を確認
* **修正内容**: インポートパスを絶対パスに統一、既存のrun_server.pyを使用
* フロントエンドの proxy 設定に影響がないことを確認済み 