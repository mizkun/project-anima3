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

* CI環境でのテスト実行時に「ModuleNotFoundError: No module named 'core'」エラーが発生する問題の修正

## 4. 問題の概要 (Problem Overview)

* CI環境でのテスト実行時に、すべてのテストファイルで「ModuleNotFoundError: No module named 'core'」というエラーが発生しています。ローカル環境では問題なく動作していますが、CI環境ではPythonのインポートパスが正しく設定されておらず、coreモジュールを見つけることができていません。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現行版
* **関連する詳細仕様書セクション**: 該当なし
* **関連するタスクリスト番号**: 6.6 全体テストとリファクタリング

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

1. GitHubのCIワークフローが実行される
2. pytestを実行するステップで、「ModuleNotFoundError: No module named 'core'」エラーが発生
3. テストが失敗してCI全体が失敗する

## 7. 期待される動作 (Expected Behavior)

* CI環境でもテストが正常に実行され、coreモジュールが適切にインポートされること
* テストが成功し、CIワークフローが成功すること

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

* CI環境でテスト実行時に「ModuleNotFoundError: No module named 'core'」エラーが発生
* テストが実行できずにCI全体が失敗する

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * CI実行ログのエラーメッセージ
    * テストファイル内のインポート文
    * プロジェクト構造とPythonパッケージ設定
* **特定された原因 (仮説を含む)**:
    * CI環境では、ローカル環境と異なりプロジェクトのルートディレクトリが自動的にPythonのインポートパスに追加されていない
    * テストファイルが「from core.xxx import」という形でインポートしているが、CI環境ではcoreモジュールの場所を見つけられない
    * 現在のパッケージ構成がモジュールをインポートするための適切な設定になっていない可能性

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    * テスト実行時にプロジェクトのルートディレクトリをPythonパスに追加する設定を行う
    * パッケージ構成を修正し、モジュールが適切にインポートできるようにする
* **具体的な変更点**:
    * pyproject.toml または tests/conftest.py にPythonパス設定を追加する
    * CI設定ファイルに必要に応じてPythonパスの環境変数設定を追加する
* **代替案 (あれば)**:
    * 各テストファイルの先頭でsys.pathを修正する方法もあるが、全ファイルを修正する必要があり冗長

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1.  **[x] サブタスク1**: conftest.pyの作成または修正
    * **変更対象ファイル**: tests/conftest.py
    * **具体的な変更内容**: プロジェクトルートをPythonパスに追加するコードを追加

2.  **[x] サブタスク2**: pyproject.tomlの修正
    * **変更対象ファイル**: pyproject.toml
    * **具体的な変更内容**: pytestセクションにrootdir設定とPythonパス設定を追加

3.  **[ ] サブタスク3**: CIでテストが通ることを確認
    * **具体的な変更内容**: 変更をプッシュしてCIワークフローが正常に完了することを確認

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **自動テスト**:
    * GitHubのCIワークフローでテストが正常に実行されることを確認
* **手動テスト**:
    * ローカル環境でも「python -m pytest」を実行してテストが正常に通ることを確認

---

## 13. 完了の定義 (Definition of Done)

* [x] 上記「提案される解決策/改善案」が実装されている。
* [x] 上記「実装計画/タスク分割」の全てのサブタスクが完了している。
* [ ] 上記「テスト計画」に記載された全てのテストが成功する。
* [ ] CI環境でのテスト実行時に「ModuleNotFoundError: No module named 'core'」エラーが発生しなくなる。
* [x] (自己レビュー) コードに明らかなバグや非効率な箇所がない。

## 14. 備考 (Notes)

* Pythonのインポートパスの問題は、プロジェクト構造やパッケージングの仕組みと密接に関連している。長期的には、より堅牢なパッケージ構造を検討する必要があるかもしれない。 