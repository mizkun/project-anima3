# design: エクスポート機能設計 - シミュレーション結果の包括的エクスポート

## 1. Issue種別 (Issue Type)

* [ ] バグ修正 (Bug Fix)
* [ ] 機能改善 (Enhancement)
* [x] 新規機能 (New Feature)
* [ ] リファクタリング (Refactoring)
* [ ] ドキュメント (Documentation)
* [ ] その他 (Other: {{specify}})

## 2. 優先度 (Priority)

* [ ] 高 (High)
* [x] 中 (Medium)
* [ ] 低 (Low)

## 3. タイトル (Title)

* design: エクスポート機能設計 - シミュレーション結果の包括的エクスポート

## 4. 問題の概要 (Problem Overview)

現在のProject Animaでは、シミュレーション結果を外部に出力する機能が不足している：

### 現在の問題点
1. **結果の保存**: シミュレーション結果が一時的で、永続化されていない
2. **共有の困難**: 作成した物語を他者と共有する手段がない
3. **バックアップ不足**: プロジェクト全体のバックアップ機能がない
4. **形式の制限**: 特定の形式での出力ができない

### ユーザーニーズ
- 作成した物語をテキストファイルとして保存したい
- プロジェクト全体をバックアップしたい
- 他のツールで編集できる形式で出力したい
- 印刷可能な形式で出力したい

## 5. 目標 (Goal)

**多様な形式でのエクスポート機能により、ユーザーの創作活動を支援し、作品の活用範囲を拡大する**

### 具体的な改善目標
- **形式の多様性**: JSON、テキスト、HTML、PDF形式での出力
- **選択的エクスポート**: 必要な部分のみを選択して出力
- **プロジェクト全体**: 設定ファイルを含む完全なバックアップ

## 6. 提案される解決策 (Proposed Solution)

### 6.1 エクスポート対象

#### シミュレーション結果
```
┌─────────────────────────────────┐
│ 📄 シミュレーション結果         │
├─────────────────────────────────┤
│ ✓ ターン別の行動・発言          │
│ ✓ キャラクターの思考過程        │
│ ✓ シーン情報                    │
│ ✓ 実行設定                      │
│ ✓ タイムスタンプ                │
└─────────────────────────────────┘
```

#### プロジェクト全体
```
┌─────────────────────────────────┐
│ 📦 プロジェクト全体             │
├─────────────────────────────────┤
│ ✓ 全シーンファイル              │
│ ✓ 全キャラクターファイル        │
│ ✓ 全プロンプトファイル          │
│ ✓ シミュレーション履歴          │
│ ✓ 設定ファイル                  │
└─────────────────────────────────┘
```

### 6.2 エクスポート形式

#### 1. JSON形式（構造化データ）
```json
{
  "project": {
    "name": "My Story Project",
    "created_at": "2024-01-15T10:00:00Z",
    "exported_at": "2024-01-15T15:30:00Z"
  },
  "simulation_runs": [
    {
      "id": "run_001",
      "scene": {
        "id": "library_study_room",
        "name": "図書館の勉強室",
        "description": "..."
      },
      "turns": [
        {
          "turn": 1,
          "character": "城月 燐子",
          "thought": "また芽依か...",
          "action": "燐子は本から視線を離し...",
          "speech": null,
          "timestamp": "2024-01-15T14:30:00Z"
        }
      ],
      "settings": {
        "max_turns": 10,
        "temperature": 0.7,
        "model": "gemini-1.5-flash"
      }
    }
  ]
}
```

#### 2. テキスト形式（読みやすい物語）
```
# 図書館の勉強室での物語

## シーン設定
- 場所: 図書館の勉強室
- 時間: 放課後
- 参加者: 城月 燐子、木下 芽依

## 物語

### ターン1 - 城月 燐子
**思考**: また芽依か... 放課後まで図書館にいるなんて、意外だな。

**行動**: 燐子は本から視線を離し、芽依が静かに本棚の間に佇んでいることに気づいた。軽くため息をつき、本を閉じ、ブックマークを挟んだ。

### ターン2 - 木下 芽依
**思考**: わ、燐子先輩... 同じ勉強室にいるなんて...！

**行動**: 深呼吸をして落ち着こうと努め、少し震える手で鞄からノートとペンを取り出す。

**発言**: 「あの...先輩、こんばんは...。」
```

#### 3. HTML形式（Web表示用）
```html
<!DOCTYPE html>
<html>
<head>
    <title>図書館の勉強室での物語</title>
    <style>
        .character { color: #2196F3; font-weight: bold; }
        .thought { font-style: italic; color: #666; }
        .action { margin: 10px 0; }
        .speech { background: #f5f5f5; padding: 10px; border-left: 3px solid #2196F3; }
    </style>
</head>
<body>
    <h1>図書館の勉強室での物語</h1>
    
    <div class="turn">
        <h3>ターン1 - <span class="character">城月 燐子</span></h3>
        <div class="thought">また芽依か... 放課後まで図書館にいるなんて、意外だな。</div>
        <div class="action">燐子は本から視線を離し、芽依が静かに本棚の間に佇んでいることに気づいた。</div>
    </div>
</body>
</html>
```

#### 4. ZIP形式（プロジェクト全体）
```
project_backup_20240115.zip
├── project.json (メタデータ)
├── scenes/
│   ├── library_study_room.yaml
│   ├── school_rooftop.yaml
│   └── school_courtyard.yaml
├── characters/
│   ├── rinko_kizuki_002/
│   │   ├── immutable.yaml
│   │   └── long_term.yaml
│   └── mei_kinoshita_001/
│       ├── immutable.yaml
│       └── long_term.yaml
├── prompts/
│   ├── character_prompt.txt
│   └── scene_prompt.txt
└── simulations/
    ├── run_001.json
    └── run_002.json
```

### 6.3 UI設計

#### エクスポートダイアログ
```
┌─────────────────────────────────┐
│ 📤 エクスポート                 │
├─────────────────────────────────┤
│ エクスポート対象:               │
│ ○ 選択したシミュレーション      │
│ ○ 全シミュレーション履歴        │
│ ○ プロジェクト全体              │
│                                 │
│ エクスポート形式:               │
│ ☑ JSON (構造化データ)          │
│ ☑ テキスト (読みやすい物語)    │
│ ☑ HTML (Web表示用)             │
│ ☐ PDF (印刷用) ※将来実装       │
│                                 │
│ オプション:                     │
│ ☑ 思考過程を含める              │
│ ☑ タイムスタンプを含める        │
│ ☐ 設定情報を含める              │
│                                 │
│ [キャンセル] [エクスポート]     │
└─────────────────────────────────┘
```

## 7. 実装計画 (Implementation Plan)

### 7.1 バックエンドAPI実装（20分）

#### サブタスク1: エクスポートAPIエンドポイント
- **新規作成**: `web/backend/api/export.py`
- **エンドポイント**:
  - `POST /api/export/simulation/{run_id}` - 単一シミュレーション
  - `POST /api/export/project` - プロジェクト全体
  - `GET /api/export/formats` - 利用可能な形式一覧

#### サブタスク2: エクスポート処理実装
- **新規作成**: `web/backend/services/export_service.py`
- **機能**: 各形式への変換ロジック
- **依存関係**: `jinja2`（テンプレート）、`zipfile`（ZIP作成）

### 7.2 フロントエンド実装（10分）

#### サブタスク3: エクスポートダイアログ
- **新規作成**: `web/frontend/src/components/Export/ExportDialog.tsx`
- **機能**: 形式選択、オプション設定、プレビュー
- **UI**: Material UIのDialog、Checkbox、RadioButton使用

#### サブタスク4: エクスポートボタン統合
- **修正対象**: 
  - `SimulationTab.tsx` - 履歴からのエクスポート
  - `Timeline.tsx` - 現在のシミュレーションのエクスポート
- **機能**: エクスポートダイアログの呼び出し

## 8. 技術的詳細 (Technical Details)

### 8.1 APIインターフェース

```typescript
// エクスポートリクエスト
interface ExportRequest {
  target: 'simulation' | 'project';
  runId?: string;
  formats: ('json' | 'text' | 'html' | 'zip')[];
  options: {
    includeThoughts: boolean;
    includeTimestamps: boolean;
    includeSettings: boolean;
  };
}

// エクスポートレスポンス
interface ExportResponse {
  success: boolean;
  files: {
    format: string;
    filename: string;
    url: string;
    size: number;
  }[];
  message?: string;
}
```

### 8.2 テンプレートシステム

```python
# export_service.py
from jinja2 import Environment, FileSystemLoader

class ExportService:
    def __init__(self):
        self.env = Environment(loader=FileSystemLoader('templates/export'))
    
    def export_to_text(self, simulation_data: dict) -> str:
        template = self.env.get_template('story.txt.j2')
        return template.render(simulation=simulation_data)
    
    def export_to_html(self, simulation_data: dict) -> str:
        template = self.env.get_template('story.html.j2')
        return template.render(simulation=simulation_data)
```

### 8.3 ファイル管理

```python
# 一時ファイルの管理
import tempfile
import os
from pathlib import Path

class FileManager:
    def __init__(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix='anima_export_'))
    
    def create_export_file(self, content: str, filename: str) -> Path:
        file_path = self.temp_dir / filename
        file_path.write_text(content, encoding='utf-8')
        return file_path
    
    def cleanup(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)
```

## 9. テスト計画 (Test Plan)

### 9.1 機能テスト
- [ ] 各形式でのエクスポート確認
- [ ] ファイルサイズ・内容の妥当性確認
- [ ] エラーハンドリングの確認

### 9.2 統合テスト
- [ ] フロントエンドからのエクスポート実行
- [ ] 大容量データのエクスポート
- [ ] 同時エクスポートリクエストの処理

### 9.3 ユーザビリティテスト
- [ ] エクスポートダイアログの使いやすさ
- [ ] ファイル形式の選択の直感性
- [ ] エクスポート結果の品質

## 10. 完了の定義 (Definition of Done)

- [ ] 4つの形式（JSON、テキスト、HTML、ZIP）でエクスポートできる
- [ ] シミュレーション単体とプロジェクト全体の両方をエクスポートできる
- [ ] エクスポートオプションが正常に動作する
- [ ] エクスポートダイアログが直感的に操作できる
- [ ] エラーハンドリングが適切に実装されている
- [ ] ファイルサイズが適切に制限されている
- [ ] 一時ファイルが適切にクリーンアップされる

## 11. 期待される効果 (Expected Benefits)

### 短期的効果
- **作品保存**: 作成した物語の永続化
- **共有促進**: 他者との作品共有が容易
- **バックアップ**: プロジェクトの安全な保管

### 長期的効果
- **創作支援**: 外部ツールとの連携による創作活動の拡大
- **コミュニティ形成**: 作品共有によるユーザーコミュニティの活性化
- **プラットフォーム価値**: エクスポート機能による差別化

## 12. 将来の拡張計画 (Future Extensions)

### Phase 2: 高度なエクスポート
- **PDF形式**: 印刷に適した形式での出力
- **EPUB形式**: 電子書籍形式での出力
- **動画形式**: アニメーション付きの物語表示

### Phase 3: クラウド連携
- **Google Drive**: 直接クラウドストレージに保存
- **GitHub**: バージョン管理システムとの連携
- **SNS**: 直接ソーシャルメディアに投稿

## 13. 備考 (Notes)

- **セキュリティ**: エクスポートファイルの一時保存期間を制限
- **パフォーマンス**: 大容量エクスポートの非同期処理
- **互換性**: 他のツールでの読み込み可能性を考慮

## ✅ 実装完了

**完了日時**: 2025-01-28 14:30

**実装内容**:
- ✅ バックエンドAPIエンドポイント実装
  - `/api/export/simulation` - シミュレーション結果のJSONエクスポート
  - `/api/export/project` - プロジェクト全体のZIPバックアップ
  - `/api/export/timeline/{format}` - タイムラインのJSON/TXTエクスポート
  - `/api/export/formats` - 利用可能な形式の一覧取得

- ✅ フロントエンドUI実装
  - SimulationTabにエクスポートセクション追加
  - 3種類のエクスポートボタン実装
  - ファイルダウンロード機能実装
  - エラーハンドリングとメッセージ表示

**確認済み機能**:
- ✅ シミュレーション結果のJSONエクスポート
- ✅ プロジェクト全体のZIPバックアップ
- ✅ タイムラインのJSON/TXT形式エクスポート
- ✅ ファイル名の自動生成（タイムスタンプ付き）
- ✅ エラーハンドリングと適切なメッセージ表示
- ✅ Material Design 3のUIコンポーネント使用

**テスト結果**:
- ✅ APIエンドポイントが正常に動作
- ✅ エクスポート形式一覧の取得が正常
- ✅ フロントエンドのボタンが適切に表示
- ✅ TypeScriptエラーの修正完了

**今後の拡張予定**:
- PDF形式でのエクスポート
- カスタムテンプレートによるエクスポート
- エクスポート履歴の管理
- バッチエクスポート機能 