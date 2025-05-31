// シミュレーション管理API
const API_BASE = "http://localhost:8000/api/simulation";

export interface SimulationCreationData {
  simulationName: string;
  location: string;
  time: string;
  situation: string;
  participantCharacterIds: string[];
}

export interface SimulationHistoryEntry {
  simulationId: string;
  simulationName: string;
  createdAt: string;
  lastAccessedAt: string;
  turnCount: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  simulationSettings: {
    location: string;
    time: string;
    situation: string;
    participant_character_ids: string[];
  };
  isActive: boolean;
  thumbnailDescription?: string;
}

export interface SimulationResponse {
  success: boolean;
  simulationId?: string;
  message?: string;
}

export interface SimulationHistoriesResponse {
  success: boolean;
  histories: SimulationHistoryEntry[];
}

export interface ActiveSimulationResponse {
  success: boolean;
  activeSimulation: SimulationHistoryEntry | null;
}

export interface SimulationStatisticsResponse {
  success: boolean;
  statistics: {
    total: number;
    active: number;
    paused: number;
    completed: number;
    archived: number;
  };
}

// 新しいシミュレーションを作成
export const createNewSimulation = async (data: SimulationCreationData): Promise<SimulationResponse> => {
  try {
    const response = await fetch(`${API_BASE}/start-new-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('シミュレーション作成エラー:', error);
    throw error;
  }
};

// シミュレーションを再開
export const resumeSimulation = async (simulationId: string): Promise<SimulationResponse> => {
  try {
    const response = await fetch(`${API_BASE}/resume-simulation/${simulationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('シミュレーション再開エラー:', error);
    throw error;
  }
};

// 全シミュレーション履歴を取得
export const getSimulationHistories = async (): Promise<SimulationHistoriesResponse> => {
  try {
    const response = await fetch(`${API_BASE}/simulation-histories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('シミュレーション履歴取得エラー:', error);
    throw error;
  }
};

// アクティブなシミュレーションを取得
export const getActiveSimulation = async (): Promise<ActiveSimulationResponse> => {
  try {
    const response = await fetch(`${API_BASE}/simulation-histories/active`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('アクティブシミュレーション取得エラー:', error);
    throw error;
  }
};

// シミュレーションを一時停止
export const pauseSimulation = async (simulationId: string): Promise<SimulationResponse> => {
  try {
    const response = await fetch(`${API_BASE}/simulation-histories/${simulationId}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('シミュレーション一時停止エラー:', error);
    throw error;
  }
};

// シミュレーション履歴を削除
export const deleteSimulationHistory = async (simulationId: string): Promise<SimulationResponse> => {
  try {
    const response = await fetch(`${API_BASE}/simulation-histories/${simulationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('シミュレーション履歴削除エラー:', error);
    throw error;
  }
};

// シミュレーション統計を取得
export const getSimulationStatistics = async (): Promise<SimulationStatisticsResponse> => {
  try {
    const response = await fetch(`${API_BASE}/simulation-histories/statistics`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('シミュレーション統計取得エラー:', error);
    throw error;
  }
};

// 利用可能なキャラクター一覧を取得
export const getAvailableCharacters = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE}/characters`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('キャラクター一覧取得エラー:', error);
    throw error;
  }
}; 