// シミュレーション状態
export type SimulationStatus = 'not_started' | 'idle' | 'running' | 'paused' | 'completed' | 'error'

// LLMプロバイダー
export type LLMProvider = 'openai' | 'gemini'

// シミュレーション設定
export interface SimulationConfig {
  character_name?: string
  scene_id?: string
  max_turns: number
  llm_provider: LLMProvider
  model_name: string
  temperature: number
  max_tokens: number
  characters_dir: string
  immutable_config_path: string
  long_term_config_path: string
  max_steps?: number
}

// キャラクター情報
export interface Character {
  id: string
  name: string
  description: string
  prompt_template: string
  personality_traits: string[]
  background: string
}

// タイムラインエントリ
export interface TimelineEntry {
  step: number
  timestamp: string
  character: string
  action_type: 'turn' | 'intervention'
  content: string
  metadata?: Record<string, any>
}

// シミュレーション状態
export interface SimulationState {
  status: SimulationStatus
  current_turn: number
  max_turns: number
  characters: Character[]
  timeline: TimelineEntry[]
  config: SimulationConfig
  scene_name?: string
  error_message?: string
  start_time?: string
  end_time?: string
}

// API レスポンス
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// シミュレーション開始リクエスト
export interface StartSimulationRequest {
  config: Partial<SimulationConfig>
}

// ファイル情報
export interface FileInfo {
  name: string
  path: string
  content: string
  last_modified: string
}

// プロンプトテンプレート
export interface PromptTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  description?: string
}

// 設定ファイル
export interface ConfigFile {
  type: 'immutable' | 'long_term'
  content: Record<string, any>
  last_modified: string
} 