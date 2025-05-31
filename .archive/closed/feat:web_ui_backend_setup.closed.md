## 1. Issue種別 (Issue Type)

* [x] 新規機能 (New Feature)

## 2. 優先度 (Priority)

* [x] 高 (High)

## 3. タイトル (Title)

Web UI用FastAPIバックエンドの基本セットアップ

## 4. 問題の概要 (Problem Overview)

現在のProject Animaはターミナルベースのインターフェースのみを提供しているが、より直感的で使いやすいWeb UIを提供するため、FastAPIベースのバックエンドサーバーを構築する必要がある。既存のSimulationEngineを活用しつつ、Web UIからの操作を可能にするAPIエンドポイントとWebSocket通信を実装する。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現在の開発版
* **関連する詳細仕様書セクション**: Web UI実装方針
* **関連するタスクリスト番号**: 新規Web UI開発

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

N/A (新規機能)

## 7. 期待される動作 (Expected Behavior)

* FastAPIサーバーが起動し、基本的なAPIエンドポイントが利用可能になること
* 既存のSimulationEngineをラップするサービスクラスが実装されること
* WebSocket通信でリアルタイム更新が可能になること
* 既存のターミナル実行に影響を与えないこと

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

現在はWeb UIが存在せず、ターミナルベースのインターフェースのみが利用可能

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * `src/project_anima/interactive_cli.py` - 現在のインタラクティブ機能
    * `src/project_anima/core/simulation_engine.py` - コアエンジン
    * `requirements.txt` - 現在の依存関係
* **特定された原因 (仮説を含む)**:
    * Web UI用のバックエンドサーバーが存在しない
    * FastAPIの依存関係が追加されていない
    * SimulationEngineをWeb API経由で操作するためのラッパーが必要

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **基本的な方針**:
    * FastAPIを使用してRESTful APIとWebSocketエンドポイントを提供
    * 既存のSimulationEngineを変更せず、ラッパーサービスクラスで操作
    * 疎結合設計により既存機能への影響を最小化
* **具体的な変更点**:
    * `web/backend/` ディレクトリの作成
    * FastAPI依存関係の追加
    * SimulationEngineラッパーサービスの実装
    * 基本的なAPIエンドポイントの実装
    * WebSocket通信の基盤実装

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1. **[ ] ディレクトリ構造の作成**
   * **変更対象ファイル**: `web/backend/` (新規作成)
   * **具体的な変更内容**: FastAPIプロジェクトの基本構造を作成

2. **[ ] 依存関係の追加**
   * **変更対象ファイル**: `requirements.txt`
   * **具体的な変更内容**: FastAPI、uvicorn、websocketsの追加

3. **[ ] FastAPIアプリケーションの基本セットアップ**
   * **変更対象ファイル**: `web/backend/main.py`
   * **具体的な変更内容**: FastAPIアプリケーションの初期化とCORS設定

4. **[ ] SimulationEngineラッパーサービスの実装**
   * **変更対象ファイル**: `web/backend/services/engine_wrapper.py`
   * **具体的な変更内容**: SimulationEngineを操作するサービスクラス

5. **[ ] 基本APIエンドポイントの実装**
   * **変更対象ファイル**: `web/backend/api/simulation.py`
   * **具体的な変更内容**: シミュレーション制御用のRESTエンドポイント

6. **[ ] WebSocket通信の基盤実装**
   * **変更対象ファイル**: `web/backend/websocket/manager.py`
   * **具体的な変更内容**: WebSocket接続管理とメッセージ配信

7. **[ ] Pydanticモデルの定義**
   * **変更対象ファイル**: `web/backend/api/models.py`
   * **具体的な変更内容**: API用のデータモデル定義

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **ユニットテスト**:
    * SimulationEngineラッパーサービスのテスト
    * APIエンドポイントのテスト
* **結合テスト/手動テスト**:
    * FastAPIサーバーの起動確認
    * 基本APIエンドポイントの動作確認
    * WebSocket接続の確認
    * 既存のターミナル実行への影響がないことの確認

---

## 13. 完了の定義 (Definition of Done)

* [x] `web/backend/` ディレクトリ構造が作成されている
* [x] FastAPI関連の依存関係が追加されている
* [x] FastAPIサーバーが正常に起動する
* [x] SimulationEngineラッパーサービスが実装されている
* [x] 基本的なAPIエンドポイントが実装されている
* [x] WebSocket通信の基盤が実装されている
* [x] Pydanticモデルが定義されている
* [x] 既存のターミナル実行に影響がない
* [x] 基本的なテストが実装され、成功する
* [x] コードに適切な型ヒントとdocstringが記述されている

**✅ Issue完了 - 2025年5月25日**

実装された機能:
- FastAPIバックエンドサーバー (ポート8000)
- SimulationEngineラッパーサービス
- RESTful APIエンドポイント (/api/simulation/*)
- WebSocket通信基盤 (/ws)
- 基本的なテストスイート
- 既存機能への影響なし

## 14. 備考 (Notes)

* 既存のSimulationEngineのコードは一切変更しない
* ポート8000でFastAPIサーバーを起動する予定
* フロントエンド開発は別Issueで実装予定 