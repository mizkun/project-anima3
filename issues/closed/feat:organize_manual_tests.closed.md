## 1. Issue種別 (Issue Type)

* [ ] バグ修正 (Bug Fix)
* [ ] 機能改善 (Enhancement)
* [ ] 新規機能 (New Feature)
* [x] リファクタリング (Refactoring)
* [ ] ドキュメント (Documentation)
* [ ] その他 (Other: {{specify}})

## 2. 優先度 (Priority)

* [ ] 高 (High)
* [x] 中 (Medium)
* [ ] 低 (Low)

## 3. タイトル (Title)

* manual_test_*.pyファイルの整理とプロジェクト構造の改善

## 4. 問題の概要 (Problem Overview)

* 現在、ルートディレクトリに複数の手動テストファイル（manual_test_context_builder.py, manual_test_information_updater.py, manual_test_llm_adapter.py, manual_test_simulation_engine.py）が配置されており、プロジェクト構造が整理されていない状態です。これらのファイルをより適切な場所に移動し、プロジェクト構造を改善する必要があります。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現行版
* **関連する詳細仕様書セクション**: 該当なし
* **関連するタスクリスト番号**: 6.6 全体テストとリファクタリング

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

該当なし（リファクタリング案件）

## 7. 期待される動作 (Expected Behavior)

* 手動テストファイル（manual_test_*.py）が専用の「examples」ディレクトリに移動され、プロジェクトのルートディレクトリがスッキリしている状態。
* 各テストファイルが適切に動作し、移動後も問題なく実行できる。

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

* 現在、複数の手動テストファイルがルートディレクトリに直接配置されており、プロジェクト構造が整理されていない。

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * プロジェクトのルートディレクトリ
    * manual_test_context_builder.py, manual_test_information_updater.py, manual_test_llm_adapter.py, manual_test_simulation_engine.py
* **特定された原因 (仮説を含む)**:
    * 開発の初期段階で手動テスト用のスクリプトをルートディレクトリに配置し、そのまま使用し続けていたため。
    * プロジェクトの成熟に伴い、より構造化されたファイル配置が望ましくなってきている。

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    * 「examples」ディレクトリを新規作成し、全ての手動テストファイルをそこに移動する。
    * 移動後もテストファイルが正常に動作するよう、必要に応じてimportパスを調整する。
* **具体的な変更点**:
    * 「examples」ディレクトリの作成
    * 各manual_test_*.pyファイルの移動
    * 移動したファイル内のimportパスの修正（必要な場合）
* **代替案 (あれば)**:
    * 手動テストファイルをtestsディレクトリの下に統合テストとして移動する案も考えられるが、これらは実行例としての性質も持つため、examplesディレクトリに配置する方が適切と判断。

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1.  **[x] サブタスク1**: examplesディレクトリの作成
    * **変更対象**: プロジェクトルートディレクトリ
    * **具体的な変更内容**: 新規ディレクトリ「examples」を作成

2.  **[x] サブタスク2**: manual_test_context_builder.pyの移動
    * **変更対象ファイル**: manual_test_context_builder.py
    * **具体的な変更内容**: ルートからexamplesディレクトリへの移動、importパスの修正（必要な場合）

3.  **[x] サブタスク3**: manual_test_information_updater.pyの移動
    * **変更対象ファイル**: manual_test_information_updater.py
    * **具体的な変更内容**: ルートからexamplesディレクトリへの移動、importパスの修正（必要な場合）

4.  **[x] サブタスク4**: manual_test_llm_adapter.pyの移動
    * **変更対象ファイル**: manual_test_llm_adapter.py
    * **具体的な変更内容**: ルートからexamplesディレクトリへの移動、importパスの修正（必要な場合）

5.  **[x] サブタスク5**: manual_test_simulation_engine.pyの移動
    * **変更対象ファイル**: manual_test_simulation_engine.py
    * **具体的な変更内容**: ルートからexamplesディレクトリへの移動、importパスの修正（必要な場合）

6.  **[x] サブタスク6**: 動作確認
    * **具体的な変更内容**: 移動後の各テストファイルが問題なく実行できることを確認

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **手動テスト**:
    * 各移動後のテストファイルを個別に実行し、エラーなく動作することを確認
    * 特に、importエラーやファイルパス関連のエラーが発生しないことを検証

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

* この変更はプロジェクト構造の改善が目的であり、機能的な変更は含まれません。 