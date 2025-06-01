# fix: キャラクターYAMLファイルのPydanticバリデーションエラー修正

## 問題の概要
複数キャラクターシミュレーション実行時に、2番目のキャラクター（mei_kinoshita_001）のターンで以下のエラーが発生していた：

```
API呼び出しエラー詳細: Error: 新しいターンが作成されませんでした (before=1, after=1)
```

## 根本原因
mei_kinoshita_001のlong_term.yamlファイルがPydanticデータモデルの期待する形式と一致していなかった：

### 期待される形式（Pydanticモデル）
```yaml
goals:
- goal: "目標の内容"
  importance: 9
memories:
- memory: "記憶の内容"
  scene_id_of_memory: "scene_id"
  related_character_ids: ["character_id"]
```

### 実際の形式（エラーの原因）
```yaml
goals:
  - "目標の内容（文字列のみ）"
memories:
  shared_moments:
    - content: "記憶の内容"
      scene_id_of_memory: "scene_id"
```

## 実装された修正

### 1. データ構造の修正
**ファイル**: `data/characters/mei_kinoshita_001/long_term.yaml`

- `goals`フィールドを文字列リストから`GoalData`オブジェクトリストに変更
- `memories`フィールドをネストした辞書構造から`MemoryData`オブジェクトリストに変更
- 各目標に`goal`と`importance`フィールドを追加
- 各記憶に`memory`、`scene_id_of_memory`、`related_character_ids`フィールドを追加

### 2. 修正後の構造
```yaml
character_id: mei_kinoshita_001

experiences:
- event: "屋上で先輩とお話しして親しみやすさを感じた経験"
  importance: 8

goals:
- goal: "好きな先輩との関係を深めたい"
  importance: 9
- goal: "より自分の気持ちを素直に表現できるようになりたい"
  importance: 8

memories:
- memory: "屋上で先輩とお話ししたときの優しい表情"
  scene_id_of_memory: "school_rooftop"
  related_character_ids: ["rinko_kizuki_002"]
```

## テスト結果

### CharacterManagerテスト
```bash
CharacterManager初期化: OK
immutable取得: OK - 木下 芽依
long_term取得: OK - goals: 4, memories: 9
```

### シミュレーションテスト
- ターン1: 城月 燐子 ✅
- ターン2: 木下 芽依 ✅ (修正前はエラー)
- ターン3: 城月 燐子 ✅ (ラウンドロビン正常動作)

## 影響範囲
- mei_kinoshita_001キャラクターファイルのみ
- 他のキャラクターファイルは既に正しい形式で作成済み
- SimulationEngineの動作に変更なし

## 今後の対策
1. 新しいキャラクターファイル作成時のテンプレート確認
2. キャラクターファイル作成時のバリデーション強化
3. 既存キャラクターファイルの定期的な構造チェック

## 関連Issue
- 前回のIssue: `issues/closed/fix-multiple-character-simulation.closed.md`
- 根本的なSimulationEngineエラーハンドリング改善も同時に実装済み 