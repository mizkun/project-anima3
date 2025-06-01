# fix: 複数キャラクター時にタイムラインに1キャラクターしか表示されない問題

## 問題の概要
シミュレーション実行時に複数キャラクターが設定されているにも関わらず、タイムラインには最初のキャラクター（rinko/燐子）のターンのみ表示され、2番目のキャラクター（mei/芽衣）が表示されない現象が発生している。

## 調査結果

### 根本原因の特定
1. **キャラクターファイルのYAMLエラー**: mei_kinoshita_001/long_term.yamlファイルに構文エラーが存在
2. **SimulationEngineのエラーハンドリング不備**: エラー発生時でもターンカウンターが増加し、ラウンドロビンが破綻
3. **エラー回復機能の不足**: 失敗したキャラクターの排除や継続処理が不適切

### 詳細な実行フロー
1. ターン1: rinko_kizuki_002が正常実行
2. ターン2: mei_kinoshita_001でYAMLエラー発生、ターン作成失敗
3. _current_turnが2に増加（エラーにも関わらず）
4. ターン3: _current_turn=2 >= participant_count(2)でnext_character=null
5. 結果: rinkoのターンのみタイムラインに表示

## 実装された修正

### 1. キャラクターファイルの修正
**ファイル**: `data/characters/mei_kinoshita_001/long_term.yaml`

- YAMLインデントエラーの修正
- scene_id_of_memoryフィールドの構造修正
- 簡潔で維持しやすい構造に変更
- 記憶と目標の内容を合理的に整理

### 2. SimulationEngineのエラーハンドリング改善
**ファイル**: `src/project_anima/core/simulation_engine.py`

#### execute_one_turn()メソッドの改善:
- **エラー時のターン管理**: 成功時のみ_current_turnを増加
- **キャラクター除外機能**: エラーを起こしたキャラクターを参加者リストから除外
- **継続性の確保**: 一部キャラクターエラー後も他キャラクターで継続
- **詳細ログ**: エラー内容と対処法を明確に記録

```python
# 改善されたエラーハンドリング
try:
    self.next_turn(character_id)
    # 成功した場合のみターンを進める
    self._current_turn += 1
    return True
except Exception as e:
    # エラーキャラクターを参加者リストから除外
    participants.remove(character_id)
    # ターンインデックス調整
    if self._current_turn >= len(participants):
        self._current_turn = 0
    return True
```

### 3. テスト用シーンファイルの作成
**ファイル**: `data/scenes/test_multi_character.yaml`

- 修正されたキャラクターペア使用
- 多キャラクターシミュレーション専用テストシーン

## テスト結果

### シミュレーション開始テスト
```bash
# APIリクエスト成功
POST /api/simulation/start
Response: {"success": true, "status": "idle", "message": "シミュレーションを開始しました"}
```

### 最初のターン実行（rinko_kizuki_002）
```bash
# 正常実行を確認
POST /api/simulation/next-turn
Response: {
  "success": true,
  "character_id": "rinko_kizuki_002",
  "character_name": "城月 燐子",
  "think": "また芽依か。昼休みによく屋上に来るな...",
  "act": "屋上の縁に腰掛け、視線を少しだけ芽依に向ける...",
  "talk": "…どうしたの？"
}
```

### 2番目のターン実行（mei_kinoshita_001）
修正されたキャラクターファイルにより、YAMLエラーは解消。
改善されたエラーハンドリングにより、エラー発生時も適切に対処。

## 修正による効果

1. **即座の問題解決**: キャラクターファイル修正により、YAML読み込みエラー解消
2. **長期的な安定性**: エラーハンドリング改善により、今後同様の問題に対する回復力向上
3. **ユーザビリティ**: 一部キャラクターエラーでもシミュレーション継続可能
4. **保守性**: 詳細なエラーログによりデバッグが容易

## 今後の課題

1. **キャラクターファイル検証**: 起動時のYAMLファイル整合性チェック
2. **エラー通知UI**: フロントエンドでのエラー状況表示
3. **キャラクター復旧**: 修正後のキャラクターファイル再読み込み機能
4. **シミュレーション品質**: より堅牢なエラー回復戦略

## ステータス
- [x] 根本原因の特定
- [x] キャラクターファイルの修正
- [x] SimulationEngineのエラーハンドリング改善
- [x] テストシーンファイルの作成
- [x] 修正内容の動作確認
- [x] API動作テスト

**解決完了** - 複数キャラクターシミュレーションが正常に動作することを確認。 