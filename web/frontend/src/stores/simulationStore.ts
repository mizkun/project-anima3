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
}

const initialState: SimulationState = {
  status: 'idle',
  current_turn: 0,
  max_turns: 10,
  characters: [],
  timeline: [],
  config: {
    max_turns: 10,
    llm_provider: 'openai',
    model_name: 'gpt-4',
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

      setStatus: (status) => 
        set({ status }, false, 'setStatus'),

      setCurrentTurn: (current_turn) => 
        set({ current_turn }, false, 'setCurrentTurn'),

      addTimelineEntry: (entry) => 
        set(
          (state) => ({ 
            timeline: [...state.timeline, entry] 
          }), 
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
            config: get().config // 設定は保持
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
    }),
    {
      name: 'simulation-store',
    }
  )
) 