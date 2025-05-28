## 1. Issue種別 (Issue Type)

* [x] バグ修正 (Bug Fix)
* [ ] 機能改善 (Enhancement)
* [ ] 新規機能 (New Feature)
* [ ] リファクタリング (Refactoring)
* [ ] ドキュメント (Documentation)
* [ ] その他 (Other: {{specify}})

## 2. 優先度 (Priority)

* [ ] 高 (High)
* [x] 中 (Medium)
* [ ] 低 (Low)

## 3. タイトル (Title)

* fix: ファイル編集機能の動作不良修正 - Material Design 3環境での実装

## 4. 問題の概要 (Problem Overview)

現在のWeb UIのファイル編集機能において、プロンプト・キャラクター・シーンファイルの読み込み・編集・保存に問題が発生している。Material Design 3への移行に合わせて、この機能を新しいUI環境で安定化させる必要がある。

**注記**: Material Design 3への移行が最優先となったため、本Issueは新UI環境での実装として位置づけを変更。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現在のバージョン
* **関連する詳細仕様書セクション**: Web UI ファイル編集機能
* **関連するタスクリスト番号**: 今日のタスク優先度2（Material Design 3移行後）
* **依存関係**: `feat-ui-redesign-material-design-3.md` の完了後に実施

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

1. Web UI（http://localhost:3000/）にアクセス
2. 右側のFile Editパネルを開く
3. ディレクトリ選択でプロンプト・キャラクター・シーンを選択
4. ファイル一覧の表示を試行
5. ファイルの選択・編集・保存を試行

**現状**: エディターエリアの高さ問題は解決済み、残りの機能問題を新UI環境で解決する。

## 7. 期待される動作 (Expected Behavior)

* プロンプトファイル（`data/prompts`）の一覧表示・選択・編集・保存ができる
* キャラクターファイル（`data/characters`）の一覧表示・選択・編集・保存ができる
* シーンファイル（`data/scenes`）の一覧表示・選択・編集・保存ができる
* 新規ファイルの作成ができる
* Monaco Editorでシンタックスハイライトが正常に動作する

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

* ファイルの読み込み・保存・作成に問題がある
* エラーメッセージが表示される可能性がある
* ファイル編集機能が正常に動作しない

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * `web/backend/api/files.py` - ファイル管理APIエンドポイント
    * `web/frontend/src/components/Editors/FileSelector.tsx` - ファイル選択コンポーネント
    * `web/frontend/src/components/Editors/EditorContainer.tsx` - エディターコンテナ
    * `web/frontend/src/hooks/useFileManager.ts` - ファイル管理フック

* **特定された原因 (仮説を含む)**:
    1. **バックエンドAPI権限問題**: `data/scenes`ディレクトリへのアクセスが許可されていない
    2. **APIエンドポイントの不整合**: ファイル読み書き処理でのエラーハンドリング不備
    3. **フロントエンド状態管理**: ファイル選択・編集状態の管理に問題
    4. **CORS設定**: フロントエンドとバックエンド間の通信問題

* **関連するログ/エラーメッセージ**:
    ```
    (具体的なエラーメッセージは調査後に記載)
    ```

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    1. バックエンドAPIの権限設定を修正してシーンディレクトリへのアクセスを許可
    2. ファイル読み書き処理のエラーハンドリングを改善
    3. フロントエンドのファイル管理ロジックを安定化
    4. 段階的なテストで各機能の動作を確認

* **具体的な変更点**:
    1. `web/backend/api/files.py`の`allowed_dirs`配列に`"data/scenes"`を追加（4箇所）
    2. APIエンドポイントのエラーハンドリング強化
    3. フロントエンドコンポーネントの状態管理改善
    4. ファイル作成時のテンプレート機能改善

* **代替案 (あれば)**:
    * 権限設定を環境変数で管理する方法もあるが、現在の実装を維持しつつ修正する方が影響範囲が小さい

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1. **[ ] サブタスク1**: バックエンドAPI権限修正
    * **変更対象ファイル**: `web/backend/api/files.py`
    * **変更対象クラス/関数**: `list_files`, `get_file`, `update_file`, `create_file`, `delete_file`
    * **具体的な変更内容**: `allowed_dirs`配列に`"data/scenes"`を追加

2. **[ ] サブタスク2**: エラーハンドリング改善
    * **変更対象ファイル**: `web/backend/api/files.py`
    * **具体的な変更内容**: ファイル読み書き処理の例外処理強化

3. **[ ] サブタスク3**: フロントエンド修正
    * **変更対象ファイル**: `web/frontend/src/components/Editors/FileSelector.tsx`
    * **具体的な変更内容**: シーンディレクトリ選択機能の確認と修正

4. **[ ] サブタスク4**: ファイル管理フック修正
    * **変更対象ファイル**: `web/frontend/src/hooks/useFileManager.ts`
    * **具体的な変更内容**: API通信エラーハンドリングの改善

5. **[ ] サブタスク5**: テンプレート機能改善
    * **変更対象ファイル**: `web/frontend/src/components/Editors/FileSelector.tsx`
    * **具体的な変更内容**: シーン・キャラクター用テンプレートの実装

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **手動テスト**:
    1. **プロンプトファイル編集テスト**:
       - `data/prompts`ディレクトリのファイル一覧表示
       - 既存ファイルの選択・編集・保存
       - 新規ファイルの作成
    
    2. **キャラクターファイル編集テスト**:
       - `data/characters`ディレクトリのファイル一覧表示
       - 既存ファイルの選択・編集・保存
       - 新規ファイルの作成
    
    3. **シーンファイル編集テスト**:
       - `data/scenes`ディレクトリのファイル一覧表示
       - 既存ファイルの選択・編集・保存
       - 新規ファイルの作成

* **結合テスト**:
    * ファイル編集後のシミュレーション実行テスト
    * 複数ファイルの連続編集テスト
    * エラー状態からの復旧テスト

---

## 13. 完了の定義 (Definition of Done)

* [ ] 上記「提案される解決策/改善案」が実装されている。
* [ ] 上記「実装計画/タスク分割」の全てのサブタスクが完了している。
* [ ] 上記「テスト計画」に記載された全てのテストが成功する。
* [ ] プロンプト・キャラクター・シーンファイルの編集が正常に動作する。
* [ ] 新規ファイルの作成が正常に動作する。
* [ ] エラーハンドリングが適切に機能する。
* [ ] TypeScriptの型安全性が維持されている。
* [ ] コードの可読性が維持/向上している。

## 14. 備考 (Notes)

* この修正は物語作成ワークフローの基盤となる重要な機能
* 修正後は他のタスクの前提条件が満たされる
* ユーザビリティの観点から、エラーメッセージの分かりやすさも重要
* 将来的なファイル管理機能拡張の基盤としても重要 