## 1. Issue種別 (Issue Type)

* [x] 新規機能 (New Feature)

## 2. 優先度 (Priority)

* [x] 中 (Medium)

## 3. タイトル (Title)

Web UIファイル編集機能（プロンプト・YAML）の実装

## 4. 問題の概要 (Problem Overview)

Web UIでプロンプトテンプレートとキャラクターのYAMLファイル（immutable.yaml、long_term.yaml）を直接編集できる機能を実装する必要がある。ユーザーがファイルシステムにアクセスすることなく、Web UI上でプロンプトの調整やキャラクター設定の変更を行えるようにする。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現在の開発版
* **関連する詳細仕様書セクション**: Web UI実装方針 - ファイル編集機能
* **関連するタスクリスト番号**: 新規Web UI開発

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

N/A (新規機能)

## 7. 期待される動作 (Expected Behavior)

* プロンプトテンプレートファイルの閲覧と編集が可能になること
* キャラクターのimmutable.yamlとlong_term.yamlの閲覧と編集が可能になること
* ファイル保存機能が正常に動作すること
* シンタックスハイライトが適用されること
* バリデーション機能でエラーを事前に検出できること
* 変更の取り消し機能が利用できること

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

現在はファイル編集機能が存在しない

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * `data/prompts/` - プロンプトテンプレートファイル
    * `data/characters/*/` - キャラクターYAMLファイル
    * Web UI設計要件
* **特定された原因 (仮説を含む)**:
    * Web UI用のファイル編集機能が存在しない
    * ファイル読み込み・保存のAPIエンドポイントが未実装
    * エディターコンポーネントが実装されていない

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    * Monaco Editorを使用して高機能なコードエディターを実装
    * ファイル種別に応じたシンタックスハイライトを提供
    * リアルタイムバリデーションでエラーを早期発見
    * 変更管理機能で安全な編集環境を提供
* **具体的な変更点**:
    * ファイル編集用APIエンドポイントの実装
    * エディターコンポーネントの実装
    * バリデーション機能の実装
    * ファイル管理機能の実装

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1. **[ ] ファイル操作APIエンドポイントの実装**
   * **変更対象ファイル**: `web/backend/api/files.py`
   * **具体的な変更内容**: ファイル読み込み・保存・一覧取得のAPIエンドポイント

2. **[ ] エディターコンテナコンポーネントの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Editors/EditorContainer.tsx`
   * **具体的な変更内容**: ファイル編集機能全体を管理するコンテナ

3. **[ ] Monaco Editorラッパーコンポーネントの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Editors/CodeEditor.tsx`
   * **具体的な変更内容**: Monaco Editorの設定とカスタマイズ

4. **[ ] ファイル選択コンポーネントの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Editors/FileSelector.tsx`
   * **具体的な変更内容**: 編集対象ファイルの選択UI

5. **[ ] プロンプトエディターの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Editors/PromptEditor.tsx`
   * **具体的な変更内容**: プロンプトテンプレート専用エディター

6. **[ ] YAMLエディターの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Editors/YamlEditor.tsx`
   * **具体的な変更内容**: YAML形式専用エディター

7. **[ ] バリデーション機能の実装**
   * **変更対象ファイル**: `web/frontend/src/hooks/useFileValidation.ts`
   * **具体的な変更内容**: ファイル形式とコンテンツのバリデーション

8. **[ ] ファイル管理フックの実装**
   * **変更対象ファイル**: `web/frontend/src/hooks/useFileManager.ts`
   * **具体的な変更内容**: ファイル操作の状態管理とAPI通信

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **ユニットテスト**:
    * ファイル操作APIのテスト
    * エディターコンポーネントのテスト
    * バリデーション機能のテスト
    * ファイル管理フックのテスト
* **結合テスト/手動テスト**:
    * ファイル読み込み・保存の動作確認
    * エディター機能の動作確認
    * バリデーション機能の動作確認
    * 複数ファイルの同時編集確認

---

## 13. 完了の定義 (Definition of Done)

* [ ] ファイル操作APIエンドポイントが実装されている
* [ ] エディターコンテナコンポーネントが実装されている
* [ ] Monaco Editorラッパーコンポーネントが実装されている
* [ ] ファイル選択コンポーネントが実装されている
* [ ] プロンプトエディターが実装されている
* [ ] YAMLエディターが実装されている
* [ ] バリデーション機能が実装されている
* [ ] ファイル管理フックが実装されている
* [ ] シンタックスハイライトが正常に動作する
* [ ] ファイル保存機能が正常に動作する
* [ ] エラーハンドリングが実装されている
* [ ] 基本的なテストが実装され、成功する
* [ ] レスポンシブデザインに対応している

## 14. 備考 (Notes)

* Monaco Editorの依存関係を追加する必要がある
* ファイル編集時の競合状態を考慮した設計とする
* 大きなファイルの編集パフォーマンスを考慮する
* 将来的にはファイルの差分表示機能も追加予定 