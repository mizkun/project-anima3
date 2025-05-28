# feat: 統合インスペクターパネル実装 - 4タブ統合による効率的なワークフロー

## 1. Issue種別 (Issue Type)

* [ ] バグ修正 (Bug Fix)
* [ ] 機能改善 (Enhancement)
* [x] 新規機能 (New Feature)
* [ ] リファクタリング (Refactoring)
* [ ] ドキュメント (Documentation)
* [ ] その他 (Other: {{specify}})

## 2. 優先度 (Priority)

* [x] 高 (High)
* [ ] 中 (Medium)
* [ ] 低 (Low)

## 3. タイトル (Title)

* feat: 統合インスペクターパネル実装 - 4タブ統合による効率的なワークフロー

## 4. 問題の概要 (Problem Overview)

現在のProject Animaでは、ファイル編集機能が右パネルの「File Edit」タブに隠れており、以下の問題がある：

### 現在の問題点
1. **機能の分散**: シーン、キャラクター、プロンプト編集が別々の場所にある
2. **アクセス性の悪さ**: ファイル編集機能が深い階層に隠れている
3. **ワークフローの非効率性**: 編集作業時に複数のタブを行き来する必要がある
4. **情報の断片化**: 関連する情報が統合されていない

### ユーザビリティの課題
- 物語作成時の編集作業が非効率
- 機能の発見性が低い
- 作業コンテキストの切り替えが頻繁

## 5. 目標 (Goal)

**4つの主要機能を統合したインスペクターパネルで、シームレスな物語作成ワークフローを実現する**

### 具体的な改善目標
- **操作効率**: タブ切り替えによる30%の効率向上
- **機能発見性**: 全機能への1クリックアクセス
- **作業継続性**: コンテキスト保持による集中力向上

## 6. 提案される解決策 (Proposed Solution)

### 統合インスペクターの4タブ構成

#### 1. シーンタブ 🎬
```
┌─────────────────────────────────┐
│ 🎬 シーン                       │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ シーン一覧                  │ │
│ │ ├ 学校の中庭 ⭐            │ │
│ │ ├ 学校の屋上               │ │
│ │ └ 図書館                   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ シーン編集エリア            │ │
│ │ name: "学校の中庭"          │ │
│ │ description: "放課後の..."   │ │
│ │ characters: [...]           │ │
│ └─────────────────────────────┘ │
│ [新規作成] [保存] [削除]        │
└─────────────────────────────────┘
```

#### 2. キャラクタータブ 👥
```
┌─────────────────────────────────┐
│ 👥 キャラクター                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ キャラクター一覧            │ │
│ │ ├ 木下 芽依 ⭐             │ │
│ │ └ 城月 燐子               │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ キャラクター編集エリア      │ │
│ │ name: "木下 芽依"           │ │
│ │ personality: "純粋で..."    │ │
│ │ background: "..."           │ │
│ └─────────────────────────────┘ │
│ [新規作成] [保存] [削除]        │
└─────────────────────────────────┘
```

#### 3. シミュレーションタブ ⚙️
```
┌─────────────────────────────────┐
│ ⚙️ シミュレーション             │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 実行履歴                    │ │
│ │ ├ 2024-01-15 14:30 (10ターン)│ │
│ │ ├ 2024-01-15 13:20 (8ターン) │ │
│ │ └ 2024-01-14 16:45 (12ターン)│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 詳細設定                    │ │
│ │ Max Turns: [10]             │ │
│ │ Temperature: [0.7]          │ │
│ │ Model: [gemini-1.5-flash]   │ │
│ └─────────────────────────────┘ │
│ [履歴を開く] [設定保存]         │
└─────────────────────────────────┘
```

#### 4. プロンプトタブ 📝
```
┌─────────────────────────────────┐
│ 📝 プロンプト                   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ プロンプト一覧              │ │
│ │ ├ character_prompt.yaml ⭐  │ │
│ │ └ scene_prompt.yaml         │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ プロンプト編集エリア        │ │
│ │ system_prompt: |            │ │
│ │   あなたは物語の...         │ │
│ │ character_prompt: |         │ │
│ │   キャラクターとして...     │ │
│ └─────────────────────────────┘ │
│ [保存] [リセット]               │
└─────────────────────────────────┘
```

## 7. 実装計画 (Implementation Plan)

### 7.1 基本構造実装（30分）

#### サブタスク1: 統合インスペクターコンポーネント作成
- **新規作成**: `web/frontend/src/components/Inspector/IntegratedInspector.tsx`
- **機能**: Material UIのTabsを使用した4タブ構成
- **状態管理**: 各タブの状態を適切に管理

#### サブタスク2: タブコンポーネント作成
- **新規作成**: `web/frontend/src/components/Inspector/tabs/`
  - `SceneTab.tsx` - シーン管理
  - `CharacterTab.tsx` - キャラクター管理
  - `SimulationTab.tsx` - シミュレーション設定・履歴
  - `PromptTab.tsx` - プロンプト編集

### 7.2 各タブ機能実装（30分）

#### サブタスク3: シーンタブ実装
- **機能**: シーン一覧表示、選択、編集、新規作成
- **API連携**: `/api/simulation/scenes`、`/api/files`
- **UI**: Material UIのList、Card、TextField使用

#### サブタスク4: キャラクタータブ実装
- **機能**: キャラクター一覧表示、選択、編集、新規作成
- **API連携**: `/api/files?directory=data/characters`
- **UI**: Material UIのList、Card、TextField使用

#### サブタスク5: シミュレーションタブ実装
- **機能**: 実行履歴表示、詳細設定、履歴からの再開
- **API連携**: `/api/simulation/status`、`/api/simulation/history`（新規）
- **UI**: Material UIのList、Slider、Select使用

#### サブタスク6: プロンプトタブ実装
- **機能**: プロンプト一覧表示、編集、保存
- **API連携**: `/api/files?directory=data/prompts`
- **UI**: Material UIのList、CodeEditor統合

## 8. 技術的詳細 (Technical Details)

### 8.1 コンポーネント構造

```typescript
// IntegratedInspector.tsx
interface IntegratedInspectorProps {
  width: number;
  onWidthChange: (width: number) => void;
}

const IntegratedInspector: React.FC<IntegratedInspectorProps> = ({
  width,
  onWidthChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <Box sx={{ width, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
        <Tab icon={<MovieIcon />} label="シーン" />
        <Tab icon={<PeopleIcon />} label="キャラクター" />
        <Tab icon={<SettingsIcon />} label="シミュレーション" />
        <Tab icon={<EditIcon />} label="プロンプト" />
      </Tabs>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && <SceneTab />}
        {activeTab === 1 && <CharacterTab />}
        {activeTab === 2 && <SimulationTab />}
        {activeTab === 3 && <PromptTab />}
      </Box>
    </Box>
  );
};
```

### 8.2 状態管理

```typescript
// hooks/useIntegratedInspector.ts
interface InspectorState {
  activeTab: number;
  scenes: Scene[];
  characters: Character[];
  prompts: Prompt[];
  simulationHistory: SimulationRun[];
}

export const useIntegratedInspector = () => {
  const [state, setState] = useState<InspectorState>({
    activeTab: 0,
    scenes: [],
    characters: [],
    prompts: [],
    simulationHistory: []
  });
  
  // 各タブのデータ取得・更新ロジック
  const loadScenes = async () => { /* ... */ };
  const loadCharacters = async () => { /* ... */ };
  const loadPrompts = async () => { /* ... */ };
  const loadSimulationHistory = async () => { /* ... */ };
  
  return {
    state,
    actions: {
      setActiveTab: (tab: number) => setState(prev => ({ ...prev, activeTab: tab })),
      loadScenes,
      loadCharacters,
      loadPrompts,
      loadSimulationHistory
    }
  };
};
```

## 9. API拡張計画 (API Extension Plan)

### 9.1 新規APIエンドポイント

#### シミュレーション履歴API
```typescript
// GET /api/simulation/history
interface SimulationRun {
  id: string;
  timestamp: string;
  sceneId: string;
  sceneName: string;
  turnCount: number;
  status: 'completed' | 'interrupted';
  results: TurnResult[];
}

// POST /api/simulation/resume/{runId}
// シミュレーション履歴からの再開
```

#### ファイルテンプレートAPI
```typescript
// GET /api/files/templates/{type}
// type: 'scene' | 'character' | 'prompt'
interface FileTemplate {
  name: string;
  content: string;
  description: string;
}
```

## 10. テスト計画 (Test Plan)

### 10.1 機能テスト
- [ ] 各タブの表示・切り替え確認
- [ ] シーン一覧・編集・作成機能
- [ ] キャラクター一覧・編集・作成機能
- [ ] プロンプト編集・保存機能
- [ ] シミュレーション履歴表示・再開機能

### 10.2 統合テスト
- [ ] タブ間でのデータ連携確認
- [ ] ファイル編集後のシミュレーション実行
- [ ] エラーハンドリングの確認

### 10.3 ユーザビリティテスト
- [ ] タブ切り替えの直感性
- [ ] 編集作業の効率性
- [ ] 情報の発見しやすさ

## 11. 完了の定義 (Definition of Done)

- [ ] 4つのタブが正常に動作する
- [ ] 各タブで対応する機能が完全に動作する
- [ ] シーンの作成・編集・削除ができる
- [ ] キャラクターの作成・編集・削除ができる
- [ ] プロンプトの編集・保存ができる
- [ ] シミュレーション履歴の表示・再開ができる
- [ ] タブ間の状態が適切に管理されている
- [ ] Material Design 3のデザインガイドラインに準拠している
- [ ] レスポンシブ対応が完了している
- [ ] エラーハンドリングが適切に実装されている

## 12. 期待される効果 (Expected Benefits)

### 短期的効果
- **操作効率30%向上**: タブ切り替えによる迅速なアクセス
- **機能発見性向上**: 全機能が一箇所に集約
- **作業継続性向上**: コンテキスト切り替えの最小化

### 長期的効果
- **ユーザー満足度向上**: 直感的で効率的なワークフロー
- **機能拡張の容易性**: 新機能の追加が簡単
- **メンテナンス性向上**: 統合されたコンポーネント構造

## 13. 備考 (Notes)

- **既存機能との互換性**: InspectionPanelの機能を完全に移行
- **段階的実装**: タブごとに順次実装・テスト
- **ユーザーフィードバック**: 実装後のユーザビリティ評価を実施 