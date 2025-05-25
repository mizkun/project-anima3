# feat: LangGraphワークフローの強化と段階的導入

## Issue概要
現在の基本的なLLM API呼び出しをLangGraphを活用したより堅牢なワークフローに強化する。

## 背景・目的
- 現在の実装では単純なAPI呼び出しのみで、エラーハンドリングが基本的
- LLM応答の品質向上のためのリトライ機能が不足
- 複雑な思考プロセス（段階的思考、検証フロー）の実装が困難
- 仕様書でLangGraphの活用が明記されているが、実装が不十分

## 提案する実装内容

### Stage 1: エラーハンドリング強化
- リトライ機能付きの思考生成フロー
- API呼び出し失敗時の自動復旧
- 応答品質の検証とフィードバックループ

### Stage 2: 複雑な思考プロセス（将来的）
- 段階的思考生成（分析→判断→行動）
- キャラクター間の相互作用フロー
- 長期情報更新の高度化

## 段階的導入計画

### Phase 1: 基本的なLangGraphワークフロー導入
1. **思考生成ワークフローの作成**
   ```python
   def create_thought_generation_workflow():
       workflow = StateGraph(ThoughtState)
       workflow.add_node("generate", generate_thought_node)
       workflow.add_node("validate", validate_response_node)
       workflow.add_node("retry", retry_node)
       workflow.add_conditional_edges(
           "validate",
           should_retry,
           {"retry": "generate", "success": END}
       )
   ```

2. **エラーハンドリングの強化**
   - API呼び出し失敗時の自動リトライ（最大3回）
   - 応答形式の検証とエラー時の再生成
   - タイムアウト処理の改善

3. **既存コードとの統合**
   - `LLMAdapter.generate_character_thought()`の置き換え
   - 既存のインターフェースを維持しつつ内部実装を変更

### Phase 2: 長期情報更新ワークフローの強化
1. **長期情報更新の高度化**
   ```python
   def create_long_term_update_workflow():
       workflow = StateGraph(UpdateState)
       workflow.add_node("analyze_events", analyze_events_node)
       workflow.add_node("generate_updates", generate_updates_node)
       workflow.add_node("validate_updates", validate_updates_node)
       workflow.add_node("apply_updates", apply_updates_node)
   ```

2. **品質向上機能**
   - 更新内容の妥当性検証
   - 既存情報との整合性チェック
   - 重要度の自動調整

### Phase 3: 高度な思考プロセス（オプション）
1. **段階的思考生成**
   - 状況分析 → 選択肢検討 → 行動決定の段階的フロー
   - 各段階での品質チェック

2. **キャラクター間相互作用**
   - 複数キャラクターの同時思考処理
   - 相互影響の考慮

## 完了条件

### Phase 1完了条件
- [ ] LangGraphを使用した思考生成ワークフローが実装されている
- [ ] エラーハンドリング（リトライ、検証）が機能している
- [ ] 既存のテストが全て通る
- [ ] 新しいワークフローのテストが作成されている
- [ ] パフォーマンスが既存実装と同等以上

### Phase 2完了条件
- [ ] 長期情報更新ワークフローが実装されている
- [ ] 更新内容の品質検証が機能している
- [ ] 既存の長期情報更新機能と互換性がある

### Phase 3完了条件（オプション）
- [ ] 段階的思考生成が実装されている
- [ ] 複雑な思考プロセスのテストが作成されている

## 備考
- Phase 1から段階的に導入し、各段階で動作確認を行う
- 既存の機能を壊さないよう、インターフェースの互換性を維持
- パフォーマンスの劣化がないよう注意深く実装
- 必要に応じてLangGraphのバージョンアップを検討