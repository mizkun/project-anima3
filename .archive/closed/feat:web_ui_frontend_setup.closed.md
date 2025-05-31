## 1. Issue種別 (Issue Type)

* [x] 新規機能 (New Feature)

## 2. 優先度 (Priority)

* [x] 高 (High)

## 3. タイトル (Title)

Web UI用Reactフロントエンドの基本セットアップ（モダン技術スタック）

## 4. 問題の概要 (Problem Overview)

Project AnimaのWeb UIを提供するため、モダンで安定した技術スタックを使用したフロントエンドアプリケーションを構築する必要がある。React + TypeScript + Vite + TailwindCSS v3 + Shadcn/ui + Framer Motionを使用し、FastAPIバックエンドと通信してシミュレーションの実行制御とリアルタイム表示を可能にする美しいユーザーインターフェースを実装する。

## 5. 発見バージョン/関連機能 (Version/Related Feature)

* **バージョン**: 現在の開発版
* **関連する詳細仕様書セクション**: Web UI実装方針
* **関連するタスクリスト番号**: 新規Web UI開発

## 6. 発生条件 / 再現手順 (Conditions / Steps to Reproduce)

N/A (新規機能)

## 7. 期待される動作 (Expected Behavior)

* Reactアプリケーションが正常に起動すること
* Shadcn/uiによる美しくモダンなUIが表示されること
* Framer Motionによるスムーズなアニメーションが動作すること
* FastAPIバックエンドとの通信が可能になること
* WebSocket通信でリアルタイム更新が受信できること
* レスポンシブデザインに対応していること
* 将来にわたって保守可能な安定した技術スタックであること

## 8. 実際の動作 / 現在の状況 (Actual Behavior / Current Situation)

現在はフロントエンドアプリケーションが存在しない

---

### 9. 原因調査 / 分析 (Cause Analysis by AI Assistant: Cursor)

* **調査した箇所**:
    * プロジェクト全体の構造
    * 既存のUI要件（ターミナルベースの機能）
    * Web UI設計要件
    * 前回のTailwindCSS v4実装での問題点
* **特定された原因 (仮説を含む)**:
    * フロントエンドアプリケーションが存在しない
    * 前回のTailwindCSS v4は実験的で不安定だった
    * UIコンポーネントライブラリが不足していた
    * アニメーションライブラリが不足していた

### 10. 提案される解決策 / 改善案 (Proposed Solution / Improvement by AI Assistant: Cursor)

* **技術スタック**:
    * **React 19** + **TypeScript 5.8** + **Vite 6** - 最新で安定したベース
    * **TailwindCSS v3.4** - 安定版（v4は実験的なため避ける）
    * **Shadcn/ui** - 現在最も人気のあるUIコンポーネントライブラリ
    * **Framer Motion** - スムーズなアニメーション
    * **Lucide React** - 美しいアイコンセット
    * **React Router** - ページ遷移
    * **React Hook Form** - フォーム管理
    * **Zustand** - 軽量な状態管理

* **基本的な方針**:
    * 安定性を最優先とした技術選択
    * コピー&ペーストで完全にカスタマイズ可能なShadcn/ui
    * 美しいアニメーションによるUX向上
    * 将来にわたって保守可能な構成

### 11. 実装計画 / タスク分割 (Implementation Plan / Sub-tasks by AI Assistant: Cursor)

1. **[ ] Reactプロジェクトの初期化**
   * **変更対象ファイル**: `web/frontend/` (新規作成)
   * **具体的な変更内容**: Vite + React + TypeScriptプロジェクトの作成

2. **[ ] TailwindCSS v3とShadcn/uiの設定**
   * **変更対象ファイル**: `web/frontend/tailwind.config.js`, `web/frontend/components.json`
   * **具体的な変更内容**: TailwindCSS v3の設定とShadcn/ui初期化

3. **[ ] 基本UIコンポーネントの追加**
   * **変更対象ファイル**: `web/frontend/src/components/ui/`
   * **具体的な変更内容**: Button、Card、Input、Dialog等の基本コンポーネント

4. **[ ] Framer Motionとアニメーション設定**
   * **変更対象ファイル**: `web/frontend/src/lib/animations.ts`
   * **具体的な変更内容**: 共通アニメーション定義

5. **[ ] 基本レイアウトコンポーネントの実装**
   * **変更対象ファイル**: `web/frontend/src/components/Layout/`
   * **具体的な変更内容**: Header、Sidebar、MainContentの美しい構造

6. **[ ] 状態管理ストアの実装**
   * **変更対象ファイル**: `web/frontend/src/stores/simulationStore.ts`
   * **具体的な変更内容**: Zustandを使用したシミュレーション状態管理

7. **[ ] API通信フックの実装**
   * **変更対象ファイル**: `web/frontend/src/hooks/useSimulation.ts`
   * **具体的な変更内容**: FastAPI通信用のカスタムフック

8. **[ ] WebSocket通信フックの実装**
   * **変更対象ファイル**: `web/frontend/src/hooks/useWebSocket.ts`
   * **具体的な変更内容**: リアルタイム通信用のカスタムフック

9. **[ ] TypeScript型定義の実装**
   * **変更対象ファイル**: `web/frontend/src/types/simulation.ts`
   * **具体的な変更内容**: シミュレーション関連の型定義

10. **[ ] 基本的なページコンポーネントの実装**
    * **変更対象ファイル**: `web/frontend/src/pages/SimulationPage.tsx`
    * **具体的な変更内容**: メインのシミュレーションページ

### 12. テスト計画 (Test Plan by AI Assistant: Cursor)

* **ユニットテスト**:
    * 状態管理ストアのテスト
    * カスタムフックのテスト
    * コンポーネントのテスト
* **結合テスト/手動テスト**:
    * Reactアプリケーションの起動確認
    * Shadcn/ui UIコンポーネントの表示確認
    * Framer Motionアニメーションの動作確認
    * レスポンシブデザインの確認
    * FastAPIバックエンドとの通信確認

---

## 13. 完了の定義 (Definition of Done)

* [ ] `web/frontend/` ディレクトリ構造が作成されている
* [ ] Reactアプリケーションが正常に起動する（ポート3000）
* [ ] TailwindCSS v3が正しく設定されている
* [ ] Shadcn/uiが初期化され、基本コンポーネントが利用可能
* [ ] Framer Motionが設定され、基本アニメーションが動作する
* [ ] 基本的なレイアウトコンポーネントが実装されている
* [ ] 状態管理ストアが実装されている
* [ ] API通信とWebSocket通信のフックが実装されている
* [ ] TypeScript型定義が実装されている
* [ ] 基本的なページコンポーネントが実装されている
* [ ] レスポンシブデザインに対応している
* [ ] ESLintとPrettierが設定されている
* [ ] 基本的なテストが実装され、成功する
* [ ] 美しいモダンなUIが表示される

## 14. 備考 (Notes)

* ポート3000でReactアプリケーションを起動する予定
* バックエンドAPIとの通信はポート8000を想定
* デザインシステムはShadcn/uiのデフォルト設定をベースとする
* TailwindCSS v3.4を使用（v4は実験的なため避ける）
* 将来的なGCPデプロイを考慮した構成とする
* 美しいアニメーションによるUX向上を重視する 