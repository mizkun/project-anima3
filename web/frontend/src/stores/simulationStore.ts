import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  SimulationState, 
  SimulationStatus, 
  TimelineEntry, 
  Character, 
  SimulationConfig 
} from '@/types/simulation'

interface SimulationStore extends SimulationState {
  // 追加の状態
  isInitialized: boolean
  isLoading: boolean
  lastSyncTime: string | null
  debugMode: boolean
  
  // Actions
  setStatus: (status: SimulationStatus) => void
  setCurrentTurn: (turn: number) => void
  addTimelineEntry: (entry: TimelineEntry) => void
  setCharacters: (characters: Character[]) => void
  setConfig: (config: SimulationConfig) => void
  setError: (error: string) => void
  clearError: () => void
  resetSimulation: () => void
  updateTimeline: (timeline: TimelineEntry[]) => void
  setStartTime: (time: string) => void
  setEndTime: (time: string) => void
  setInitialized: (initialized: boolean) => void
  setLoading: (loading: boolean) => void
  setDebugMode: (debugMode: boolean) => void
  syncFromBackend: (backendState: Partial<SimulationState>) => void
  updateFromBackend: (backendState: any) => void
  markSynced: () => void
}

const initialState: SimulationState = {
  status: 'not_started',
  current_turn: 0,
  max_turns: 10,
  characters: [],
  timeline: [],
  scene_name: undefined,
  config: {
    character_name: '',
    max_turns: 10,
    max_steps: 10,
    llm_provider: 'gemini',
    model_name: 'gemini-pro',
    temperature: 0.7,
    max_tokens: 1000,
    characters_dir: 'data/characters',
    immutable_config_path: 'data/immutable.yaml',
    long_term_config_path: 'data/long_term.yaml',
  },
}

export const useSimulationStore = create<SimulationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      isInitialized: false,
      isLoading: false,
      lastSyncTime: null,
      debugMode: false,

      setStatus: (status) => 
        set({ status }, false, 'setStatus'),

      setCurrentTurn: (current_turn) => 
        set({ current_turn }, false, 'setCurrentTurn'),

      addTimelineEntry: (entry) => 
        set(
          (state) => {
            console.log('simulationStore: addTimelineEntry called with:', entry)
            console.log('simulationStore: current timeline length:', state.timeline.length)
            const newTimeline = [...state.timeline, entry]
            console.log('simulationStore: new timeline length:', newTimeline.length)
            return { timeline: newTimeline }
          }, 
          false, 
          'addTimelineEntry'
        ),

      setCharacters: (characters) => 
        set({ characters }, false, 'setCharacters'),

      setConfig: (config) => 
        set({ config }, false, 'setConfig'),

      setError: (error_message) => 
        set({ error_message, status: 'error' }, false, 'setError'),

      clearError: () => 
        set({ error_message: undefined }, false, 'clearError'),

      resetSimulation: () => 
        set(
          { 
            ...initialState,
            config: get().config, // 設定は保持
            isInitialized: get().isInitialized, // 初期化状態も保持
            isLoading: false,
            lastSyncTime: null,
          }, 
          false, 
          'resetSimulation'
        ),

      updateTimeline: (timeline) => 
        set({ timeline }, false, 'updateTimeline'),

      setStartTime: (start_time) => 
        set({ start_time }, false, 'setStartTime'),

      setEndTime: (end_time) => 
        set({ end_time }, false, 'setEndTime'),

      setInitialized: (isInitialized) => 
        set({ isInitialized }, false, 'setInitialized'),

      setLoading: (isLoading) => 
        set({ isLoading }, false, 'setLoading'),

      setDebugMode: (debugMode) => 
        set({ debugMode }, false, 'setDebugMode'),

      // バックエンドの状態をフロントエンドに同期
      syncFromBackend: (backendState) => 
        set(
          (state) => ({
            ...state,
            ...backendState,
            // 重要な状態のみ同期し、UIの状態は保持
            status: backendState.status || state.status,
            current_turn: backendState.current_turn !== undefined ? backendState.current_turn : state.current_turn,
            timeline: backendState.timeline || state.timeline,
            characters: backendState.characters || state.characters,
            scene_name: backendState.scene_name || state.scene_name,
            config: backendState.config ? { ...state.config, ...backendState.config } : state.config,
          }),
          false,
          'syncFromBackend'
        ),

      // ポーリング用のバックエンド状態更新
      updateFromBackend: (backendState) => {
        if (backendState && typeof backendState === 'object') {
          set(
            (state) => ({
              ...state,
              status: backendState.status || state.status,
              current_turn: backendState.current_turn !== undefined ? backendState.current_turn : state.current_turn,
              timeline: backendState.timeline || state.timeline,
              characters: backendState.characters || state.characters,
              scene_name: backendState.scene_name || state.scene_name,
              config: backendState.config ? { ...state.config, ...backendState.config } : state.config,
              lastSyncTime: new Date().toISOString(),
              isInitialized: true,
            }),
            false,
            'updateFromBackend'
          )
        }
      },

      // 同期完了をマーク
      markSynced: () => {
        console.log('simulationStore: markSynced called - 初期化完了')
        set({ 
          lastSyncTime: new Date().toISOString(),
          isInitialized: true 
        }, false, 'markSynced')
      },
    }),
    {
      name: 'simulation-store',
    }
  )
) 