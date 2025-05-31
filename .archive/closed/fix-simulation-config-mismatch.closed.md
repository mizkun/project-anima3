# fix: フロントエンドとバックエンドのSimulationConfig構造不一致を修正

## 問題の概要
フロントエンドとバックエンドでSimulationConfigの構造が異なるため、シミュレーション開始時に422エラーが発生している。

## 現象
- シミュレーション開始ボタンを押すと422 Unprocessable Entityエラーが発生
- バックエンドがフロントエンドから送信されたデータを正しく解析できない

## 原因
### バックエンド (web/backend/api/models.py)
```python
class SimulationConfig(BaseModel):
    character_name: str  # 必須
    llm_provider: LLMProvider
    model_name: str
    max_steps: Optional[int] = None
```

### フロントエンド (web/frontend/src/types/simulation.ts)
```typescript
export interface SimulationConfig {
  max_turns: number
  llm_provider: LLMProvider
  model_name: string
  temperature: number
  max_tokens: number
  characters_dir: string
  immutable_config_path: string
  long_term_config_path: string
}
```

## 修正方針
1. バックエンドのSimulationConfigを拡張してフロントエンドの項目を含める
2. フロントエンドにcharacter_nameフィールドを追加
3. 両方で一貫した構造を使用する

## 影響範囲
- `web/backend/api/models.py`
- `web/frontend/src/types/simulation.ts`
- `web/frontend/src/hooks/useSimulationControls.ts`
- シミュレーション開始機能

## 優先度
高 - シミュレーション機能の基本動作に影響

## 修正内容
### バックエンド
- SimulationConfigにフロントエンドの全フィールドを追加
- character_nameをオプショナルに変更
- LLMProviderを'gemini'に統一

### フロントエンド
- SimulationConfigにcharacter_nameとmax_stepsを追加
- LLMProviderを'openai' | 'gemini'に統一
- デフォルト設定をgemini/gemini-proに変更

## 完了日時
2025-05-26 21:45 