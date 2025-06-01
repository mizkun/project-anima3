# fix: 追加キャラクター（nobunaga, ieyasu）のYAMLバリデーションエラー修正

## 問題の概要
meiとrinkoの2キャラクターでは動作するようになったが、nobunagaも含めると以下のエラーで落ちていた：

```
次ターン実行エラー: Error: 新しいターンが作成されませんでした (before=2, after=2)
```

## 根本原因

### nobunagaキャラクター
`data/characters/nobunaga/long_term.yaml`で以下の問題：
- `goals`フィールドがnull（空でPydanticがlistを期待）
- `memories`フィールドがnull（空でPydanticがlistを期待）

**修正前:**
```yaml
goals:
memories:
```

**修正後:**
```yaml
goals:
- goal: 天下統一を成し遂げること
  importance: 10
memories:
- memory: 初めて戦場に立った時の緊張と興奮
  scene_id_of_memory: first_battle
  related_character_ids: []
```

### ieyasuキャラクター
`data/characters/ieyasu/long_term.yaml`で以下のYAML構文エラー：
- `related_character_ids:`の後に改行があり、次の行に`[]`が単独で配置されていた

**修正前:**
```yaml
related_character_ids:
  []
```

**修正後:**
```yaml
related_character_ids: []
```

## 実装された修正

### 1. nobunagaキャラクター修正
**ファイル**: `data/characters/nobunaga/long_term.yaml`

- 空のgoalsとmemoriesフィールドを適切なリスト形式に変更
- 戦国武将らしい経験、目標、記憶を追加
- 天下統一などのテーマに沿った内容で充実化

### 2. ieyasuキャラクター修正
**ファイル**: `data/characters/ieyasu/long_term.yaml`

- YAML構文エラーを修正
- related_character_idsの記述を正常化
- 徳川家康らしい慎重さや民衆思いの特徴を反映した内容に拡充

### 3. 3キャラクターテストシーン作成
**ファイル**: `data/scenes/test_three_characters.yaml`

現代の学校設定で3キャラクター（rinko, mei, nobunaga）が同時に登場するテストシーンを作成

## テスト結果

### CharacterManagerテスト
```bash
nobunaga:
  immutable取得: OK - 織田信長
  long_term取得: OK - goals: 4, memories: 4
ieyasu:
  immutable取得: OK - 徳川家康
  long_term取得: OK - goals: 4, memories: 3
```

### 3キャラクターシミュレーションテスト
- ターン1: 城月 燐子 ✅
- ターン2: 木下 芽依 ✅
- ターン3: 織田信長 ✅ (修正前はここでエラー)
- ターン4: 城月 燐子 ✅ (ラウンドロビン正常動作)

## 影響範囲
- nobunaga, ieyasuキャラクターファイルのみ
- mei_kinoshita_001は前回のIssueで既に修正済み
- rinko_kizuki_002は元々正しい形式で作成済み
- SimulationEngineの動作に変更なし

## 今後の対策
1. 全キャラクターファイルの一括バリデーションスクリプト作成
2. CI/CDでのキャラクターファイル構文チェック追加
3. キャラクター作成時の自動テンプレート生成機能の改善

## 関連Issue
- 前回のIssue: `issues/closed/fix-character-yaml-validation-error.closed.md`
- 複数キャラクターシミュレーション問題の完全解決 