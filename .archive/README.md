# Project Anima - Archived Components

このディレクトリには、Project Animaの古いアーキテクチャとファイルがアーカイブされています。

## アーカイブ内容

### 📁 `logs/`
- 古いシミュレーション実行ログ
- `sim_YYYYMMDD_HHMMSS/` 形式のログディレクトリ
- JSONファイル形式の実行履歴

### 📁 `scene_history/`
- 古いシーン履歴管理システム
- Scene概念ベースのアーキテクチャ時代のデータ

### 📁 `core/`
- 古いScene管理関連コード
- `scene_manager.py` - 旧Sceneマネージャー

### 📁 `closed/`
- 完了・クローズされたIssueファイル
- 開発履歴として保存

## アーキテクチャ変更履歴

- **2025年5月**: Scene概念からSimulation概念への移行
- **旧システム**: `@scenes`、`@logs`ディレクトリベース
- **新システム**: シンプル化されたSimulation管理

## 注意事項

⚠️ このディレクトリ内のファイルは参考用です。  
現在のシステムでは使用されていません。

---
*アーカイブ作成日: 2025-05-30* 