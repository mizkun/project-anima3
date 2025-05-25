/**
 * シミュレーション状態管理ストア
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  SimulationState,
  TimelineEntry,
  UIState,
  ControlPanelState,
  WebSocketMessage,
} from '../types/simulation';

interface SimulationStore {
  // シミュレーション状態
  simulation: SimulationState;
  
  // UI状態
  ui: UIState;
  
  // コントロールパネル状態
  controlPanel: ControlPanelState;
  
  // 利用可能なデータ
  availableCharacters: string[];
  availableScenes: string[];
  
  // アクション
  setSimulationState: (state: Partial<SimulationState>) => void;
  setUIState: (state: Partial<UIState>) => void;
  setControlPanelState: (state: Partial<ControlPanelState>) => void;
  setAvailableCharacters: (characters: string[]) => void;
  setAvailableScenes: (scenes: string[]) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  clearTimeline: () => void;
  resetSimulation: () => void;
  handleWebSocketMessage: (message: WebSocketMessage) => void;
}

const initialSimulationState: SimulationState = {
  status: 'idle',
  current_step: 0,
  total_steps: undefined,
  character_name: '',
  timeline: [],
  config: {
    character_name: '',
    llm_provider: 'gemini',
    model_name: 'gemini-1.5-flash-latest',
    max_steps: undefined,
  },
};

const initialUIState: UIState = {
  isLoading: false,
  error: null,
  isConnected: false,
  lastUpdate: null,
};

const initialControlPanelState: ControlPanelState = {
  selectedCharacter: '',
  selectedLLMProvider: 'gemini',
  selectedModel: 'gemini-1.5-flash-latest',
  maxSteps: undefined,
};

export const useSimulationStore = create<SimulationStore>()(
  devtools(
    (set, get) => ({
      // 初期状態
      simulation: initialSimulationState,
      ui: initialUIState,
      controlPanel: initialControlPanelState,
      availableCharacters: [],
      availableScenes: [],

      // アクション
      setSimulationState: (state) =>
        set(
          (prev) => ({
            simulation: { ...prev.simulation, ...state },
            ui: { ...prev.ui, lastUpdate: new Date().toISOString() },
          }),
          false,
          'setSimulationState'
        ),

      setUIState: (state) =>
        set(
          (prev) => ({
            ui: { ...prev.ui, ...state },
          }),
          false,
          'setUIState'
        ),

      setControlPanelState: (state) =>
        set(
          (prev) => ({
            controlPanel: { ...prev.controlPanel, ...state },
          }),
          false,
          'setControlPanelState'
        ),

      setAvailableCharacters: (characters) =>
        set(
          { availableCharacters: characters },
          false,
          'setAvailableCharacters'
        ),

      setAvailableScenes: (scenes) =>
        set({ availableScenes: scenes }, false, 'setAvailableScenes'),

      addTimelineEntry: (entry) =>
        set(
          (prev) => ({
            simulation: {
              ...prev.simulation,
              timeline: [...prev.simulation.timeline, entry],
              current_step: Math.max(prev.simulation.current_step, entry.step),
            },
            ui: { ...prev.ui, lastUpdate: new Date().toISOString() },
          }),
          false,
          'addTimelineEntry'
        ),

      clearTimeline: () =>
        set(
          (prev) => ({
            simulation: {
              ...prev.simulation,
              timeline: [],
              current_step: 0,
            },
          }),
          false,
          'clearTimeline'
        ),

      resetSimulation: () =>
        set(
          {
            simulation: initialSimulationState,
            ui: { ...initialUIState, isConnected: get().ui.isConnected },
          },
          false,
          'resetSimulation'
        ),

      handleWebSocketMessage: (message) => {
        const { type, data } = message;
        
        switch (type) {
          case 'connection_established':
            set(
              (prev) => ({
                ui: { ...prev.ui, isConnected: true, error: null },
              }),
              false,
              'websocket:connection_established'
            );
            break;

          case 'simulation_started':
            set(
              (prev) => ({
                simulation: {
                  ...prev.simulation,
                  status: data.status || 'running',
                  config: data.config || prev.simulation.config,
                },
                ui: { ...prev.ui, error: null, lastUpdate: new Date().toISOString() },
              }),
              false,
              'websocket:simulation_started'
            );
            break;

          case 'simulation_stopped':
          case 'simulation_completed':
            set(
              (prev) => ({
                simulation: {
                  ...prev.simulation,
                  status: data.status || 'idle',
                },
                ui: { ...prev.ui, lastUpdate: new Date().toISOString() },
              }),
              false,
              `websocket:${type}`
            );
            break;

          case 'turn_completed':
            if (data.turn_number && data.character_name) {
              const entry: TimelineEntry = {
                step: data.turn_number,
                timestamp: new Date().toISOString(),
                character: data.character_name,
                action_type: 'turn',
                content: `思考: ${data.think || ''}\n行動: ${data.act || ''}\n発言: ${data.talk || ''}`,
                metadata: {
                  think: data.think,
                  act: data.act,
                  talk: data.talk,
                },
              };
              get().addTimelineEntry(entry);
            }
            break;

          case 'intervention_applied':
            if (data.intervention_type && data.content) {
              const entry: TimelineEntry = {
                step: get().simulation.current_step + 0.5, // 介入は小数点で表現
                timestamp: new Date().toISOString(),
                character: 'システム',
                action_type: 'intervention',
                content: `介入: ${data.intervention_type} - ${data.content}`,
                metadata: {
                  intervention_type: data.intervention_type,
                  intervention_content: data.content,
                },
              };
              get().addTimelineEntry(entry);
            }
            break;

          case 'llm_model_updated':
            set(
              (prev) => ({
                simulation: {
                  ...prev.simulation,
                  config: {
                    ...prev.simulation.config,
                    llm_provider: data.llm_provider,
                    model_name: data.model_name,
                  },
                },
                controlPanel: {
                  ...prev.controlPanel,
                  selectedLLMProvider: data.llm_provider,
                  selectedModel: data.model_name,
                },
                ui: { ...prev.ui, lastUpdate: new Date().toISOString() },
              }),
              false,
              'websocket:llm_model_updated'
            );
            break;

          case 'status_update':
            if (data) {
              set(
                (prev) => ({
                  simulation: { ...prev.simulation, ...data },
                  ui: { ...prev.ui, lastUpdate: new Date().toISOString() },
                }),
                false,
                'websocket:status_update'
              );
            }
            break;

          case 'error':
          case 'simulation_error':
          case 'turn_error':
            set(
              (prev) => ({
                ui: {
                  ...prev.ui,
                  error: data.message || data.error || 'エラーが発生しました',
                  lastUpdate: new Date().toISOString(),
                },
              }),
              false,
              `websocket:${type}`
            );
            break;

          default:
            console.log('未処理のWebSocketメッセージ:', message);
        }
      },
    }),
    {
      name: 'simulation-store',
    }
  )
); 