/**
 * シミュレーション関連の型定義
 */

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export type LLMProvider = 'openai' | 'gemini';

export interface SimulationConfig {
  character_name: string;
  llm_provider: LLMProvider;
  model_name: string;
  max_steps?: number;
}

export interface TimelineEntry {
  step: number;
  timestamp: string;
  character: string;
  action_type: string;
  content: string;
  metadata?: {
    think?: string;
    act?: string;
    talk?: string;
    [key: string]: any;
  };
}

export interface SimulationState {
  status: SimulationStatus;
  current_step: number;
  total_steps?: number;
  character_name: string;
  timeline: TimelineEntry[];
  config: SimulationConfig;
}

export interface SimulationResponse {
  status: SimulationStatus;
  message: string;
  data?: any;
}

export interface InterventionRequest {
  intervention_type: string;
  content: string;
  metadata?: {
    character_id?: string;
    [key: string]: any;
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface APIError {
  error: string;
  detail?: string;
  code?: string;
}

// UI関連の型定義
export interface UIState {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: string | null;
}

export interface ControlPanelState {
  selectedCharacter: string;
  selectedLLMProvider: LLMProvider;
  selectedModel: string;
  maxSteps?: number;
}

// WebSocket メッセージタイプ
export type WebSocketMessageType = 
  | 'connection_established'
  | 'simulation_started'
  | 'simulation_stopped'
  | 'simulation_completed'
  | 'simulation_error'
  | 'turn_completed'
  | 'turn_error'
  | 'intervention_applied'
  | 'llm_model_updated'
  | 'status_update'
  | 'subscription_confirmed'
  | 'pong'
  | 'error';

// API エンドポイント関連
export interface HealthCheckResponse {
  status: string;
  simulation_status: SimulationStatus;
  websocket_connections: number;
  timestamp: string;
}

export interface CharacterInfo {
  id: string;
  name: string;
  description?: string;
}

export interface SceneInfo {
  id: string;
  name: string;
  description?: string;
} 