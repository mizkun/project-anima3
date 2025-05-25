# fix: CIでのPytestエラー修正

## 概要
CIでPytestが失敗している問題を修正する。

## 問題の詳細
- CIでPytestを実行すると48個のテストが失敗していた
- 主な原因は`SimulationEngine.__init__()`のパラメータ名の変更に伴うテストコードの不整合

## エラー内容
```
TypeError: SimulationEngine.__init__() got an unexpected keyword argument 'characters_base_path'
```

## 原因分析
1. `SimulationEngine.__init__()`のパラメータ名が`characters_base_path`から`characters_dir`に変更されている
2. テストコードが古いパラメータ名`characters_base_path`を使用している
3. テストコードが古い属性名`_current_turn_index`を使用している（現在は`_current_turn`）

## 修正内容

### 1. テストファイルのパラメータ名修正
- `tests/test_simulation_engine.py`
- `tests/unit/test_simulation_engine.py`
- `tests/manual/manual_test_simulation_engine.py`

**修正前:**
```python
self.characters_base_path = "test_characters"
self.engine = SimulationEngine(
    scene_file_path=self.scene_file_path,
    characters_base_path=self.characters_base_path,
)
```

**修正後:**
```python
self.characters_dir = "test_characters"
self.engine = SimulationEngine(
    scene_file_path=self.scene_file_path,
    characters_dir=self.characters_dir,
)
```

### 2. テストコードの属性名修正
**修正前:**
```python
self.engine._current_turn_index = 0
```

**修正後:**
```python
self.engine._current_turn = 0
```

### 3. 不要な属性参照の削除
テストの初期化チェックから存在しない属性の参照を削除

## 検証結果
- 修正前: 48個のテストが失敗、159個が成功
- 修正後: 207個のテストがすべて成功

## 影響範囲
- テストコードのみの修正
- 実際のアプリケーションコードには影響なし

## 完了条件
- [x] すべてのテストファイルでパラメータ名を修正
- [x] 属性名の不整合を修正
- [x] ローカルでのテスト実行が成功
- [ ] CIでのテスト実行が成功

## 備考
この修正により、CIでのテスト実行が正常に動作するようになる。 