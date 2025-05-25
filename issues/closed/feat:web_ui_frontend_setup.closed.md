## 1. Issue種別 (Issue Type)

* [x] 新規機能 (New Feature)

## 2. 優先度 (Priority)

* [x] 高 (High)

## 3. タイトル (Title)

Web UI用Reactフロントエンドの基本セットアップ

## 4. 問題の概要 (Problem Overview)

Project AnimaのWeb UIを提供するため、React + TypeScript + Tailwind CSSを使用したモダンなフロントエンドアプリケーションを構築する必要がある。FastAPIバックエンドと通信し、シミュレーションの実行制御とリアルタイム表示を可能にするユーザーインターフェースを実装する。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現在の開発版
* **関連する詳細仕様書セクション**: Web UI実装方針
* **関連するタスクリスト番号**: 新規Web UI開発

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

N/A (新規機能)

## 7. 期待される動作 (Expected Behavior)

* Reactアプリケーションが正常に起動すること
* モダンで直感的なUIが表示されること
* FastAPIバックエンドとの通信が可能になること
* WebSocket通信でリアルタイム更新が受信できること
* レスポンシブデザインに対応していること

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

現在はフロントエンドアプリケーションが存在しない

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * プロジェクト全体の構造
    * 既存のUI要件（ターミナルベースの機能）
    * Web UI設計要件
* **特定された原因 (仮説を含む)**:
    * フロントエンドアプリケーションが存在しない
    * React開発環境が構築されていない
    * UI設計とコンポーネント構造が定義されていない

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    * Vite + React + TypeScriptで高速な開発環境を構築
    * Tailwind CSSでモダンなデザインシステムを実装
    * Zustandで軽量な状態管理を実現
    * WebSocket通信でリアルタイム更新を実装
* **具体的な変更点**:
    * `web/frontend/` ディレクトリの作成
    * Reactアプリケーションの初期化
    * 基本的なコンポーネント構造の実装
    * 状態管理の基盤実装
    * API通信の基盤実装

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1. **[ ] Reactプロジェクトの初期化**
   * **変更対象ファイル**: `web/frontend/` (新規作成)
   * **具体的な変更内容**: Vite + React + TypeScriptプロジェクトの作成

2. **[ ] 依存関係の設定**
   * **変更対象ファイル**: `web/frontend/package.json`
   * **具体的な変更内容**: 必要なライブラリの追加（Tailwind CSS、Zustand等）

3. **[ ] 基本レイアウトコンポーネントの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Layout/`
   * **具体的な変更内容**: Header、Sidebar、MainContentの基本構造

4. **[ ] 状態管理ストアの実装**
   * **変更対象ファイル**: `web/frontend/src/stores/simulationStore.ts`
   * **具体的な変更内容**: Zustandを使用したシミュレーション状態管理

5. **[ ] API通信フックの実装**
   * **変更対象ファイル**: `web/frontend/src/hooks/useSimulation.ts`
   * **具体的な変更内容**: FastAPI通信用のカスタムフック

6. **[ ] WebSocket通信フックの実装**
   * **変更対象ファイル**: `web/frontend/src/hooks/useWebSocket.ts`
   * **具体的な変更内容**: リアルタイム通信用のカスタムフック

7. **[ ] TypeScript型定義の実装**
   * **変更対象ファイル**: `web/frontend/src/types/simulation.ts`
   * **具体的な変更内容**: シミュレーション関連の型定義

8. **[ ] 基本的なページコンポーネントの実装**
   * **変更対象ファイル**: `web/frontend/src/pages/SimulationPage.tsx`
   * **具体的な変更内容**: メインのシミュレーションページ

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **ユニットテスト**:
    * 状態管理ストアのテスト
    * カスタムフックのテスト
    * コンポーネントのテスト
* **結合テスト/手動テスト**:
    * Reactアプリケーションの起動確認
    * 基本UIの表示確認
    * レスポンシブデザインの確認
    * FastAPIバックエンドとの通信確認

---

## 13. 完了の定義 (Definition of Done)

* [ ] `web/frontend/` ディレクトリ構造が作成されている
* [ ] Reactアプリケーションが正常に起動する（ポート3000）
* [ ] 基本的なレイアウトコンポーネントが実装されている
* [ ] 状態管理ストアが実装されている
* [ ] API通信とWebSocket通信のフックが実装されている
* [ ] TypeScript型定義が実装されている
* [ ] 基本的なページコンポーネントが実装されている
* [ ] Tailwind CSSが正しく設定されている
* [ ] レスポンシブデザインに対応している
* [ ] ESLintとPrettierが設定されている
* [ ] 基本的なテストが実装され、成功する

## 14. 備考 (Notes)

* ポート3000でReactアプリケーションを起動する予定
* バックエンドAPIとの通信はポート8000を想定
* デザインシステムはTailwind CSSのデフォルト設定をベースとする
* 将来的なGCPデプロイを考慮した構成とする 