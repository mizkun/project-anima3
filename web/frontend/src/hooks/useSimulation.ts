/**
 * シミュレーション API 通信フック
 */
import { useCallback } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import type {
  SimulationConfig,
  SimulationResponse,
  SimulationState,
  InterventionRequest,
  LLMProvider,
  HealthCheckResponse,
} from '../types/simulation';

const API_BASE_URL = 'http://localhost:8000';

class APIError extends Error {
  status?: number;
  data?: any;

  constructor(
    message: string,
    status?: number,
    data?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    
    throw new APIError(
      errorData.detail || errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
};

export const useSimulation = () => {
  const {
    setSimulationState,
    setUIState,
    setAvailableCharacters,
    setAvailableScenes,
    resetSimulation,
  } = useSimulationStore();

  // ヘルスチェック
  const checkHealth = useCallback(async (): Promise<HealthCheckResponse> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<HealthCheckResponse>('/api/health');
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'ヘルスチェックに失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setUIState]);

  // シミュレーション状態取得
  const getSimulationStatus = useCallback(async (): Promise<SimulationState> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<SimulationState>('/api/simulation/status');
      setSimulationState(response);
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'ステータス取得に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setSimulationState, setUIState]);

  // シミュレーション開始
  const startSimulation = useCallback(async (config: SimulationConfig): Promise<SimulationResponse> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<SimulationResponse>('/api/simulation/start', {
        method: 'POST',
        body: JSON.stringify({ config }),
      });
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'シミュレーション開始に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setUIState]);

  // 次のターン実行
  const executeNextTurn = useCallback(async (): Promise<SimulationResponse> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<SimulationResponse>('/api/simulation/next', {
        method: 'POST',
      });
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'ターン実行に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setUIState]);

  // シミュレーション停止
  const stopSimulation = useCallback(async (): Promise<SimulationResponse> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<SimulationResponse>('/api/simulation/stop', {
        method: 'POST',
      });
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'シミュレーション停止に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setUIState]);

  // 介入処理
  const processIntervention = useCallback(async (intervention: InterventionRequest): Promise<SimulationResponse> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<SimulationResponse>('/api/simulation/intervene', {
        method: 'POST',
        body: JSON.stringify(intervention),
      });
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : '介入処理に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setUIState]);

  // LLMモデル更新
  const updateLLMModel = useCallback(async (
    llmProvider: LLMProvider,
    modelName: string
  ): Promise<SimulationResponse> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<SimulationResponse>(
        `/api/simulation/llm-model?llm_provider=${llmProvider}&model_name=${encodeURIComponent(modelName)}`,
        {
          method: 'PUT',
        }
      );
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'LLMモデル更新に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setUIState]);

  // 利用可能なキャラクター取得
  const getAvailableCharacters = useCallback(async (): Promise<string[]> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<string[]>('/api/simulation/characters');
      setAvailableCharacters(response);
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'キャラクター一覧取得に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setAvailableCharacters, setUIState]);

  // 利用可能なシーン取得
  const getAvailableScenes = useCallback(async (): Promise<string[]> => {
    setUIState({ isLoading: true, error: null });
    try {
      const response = await apiRequest<string[]>('/api/simulation/scenes');
      setAvailableScenes(response);
      setUIState({ isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'シーン一覧取得に失敗しました';
      setUIState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, [setAvailableScenes, setUIState]);

  // 初期データ読み込み
  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        getAvailableCharacters(),
        getAvailableScenes(),
        getSimulationStatus(),
      ]);
    } catch (error) {
      console.error('初期データ読み込みエラー:', error);
    }
  }, [getAvailableCharacters, getAvailableScenes, getSimulationStatus]);

  return {
    // API メソッド
    checkHealth,
    getSimulationStatus,
    startSimulation,
    executeNextTurn,
    stopSimulation,
    processIntervention,
    updateLLMModel,
    getAvailableCharacters,
    getAvailableScenes,
    loadInitialData,
    
    // ユーティリティ
    resetSimulation,
  };
}; 