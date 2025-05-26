import { useState, useCallback } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import type { 
  ApiResponse, 
  StartSimulationRequest, 
  SimulationConfig,
  Character,
  FileInfo,
  PromptTemplate,
  ConfigFile
} from '@/types/simulation'

const API_BASE_URL = '/api'

export const useSimulation = () => {
  const [loading, setLoading] = useState(false)
  const store = useSimulationStore()

  const apiCall = useCallback(async <T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API call failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }, [])

  const startSimulation = useCallback(async (config?: Partial<SimulationConfig>) => {
    setLoading(true)
    store.clearError()

    try {
      const request: StartSimulationRequest = { config: config || {} }
      const response = await apiCall<{ simulation_id: string }>('/simulation/start', {
        method: 'POST',
        body: JSON.stringify(request),
      })

      if (response.success) {
        store.setStatus('running')
        store.setStartTime(new Date().toISOString())
        return response.data?.simulation_id
      } else {
        store.setError(response.error || 'Failed to start simulation')
        return null
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [apiCall, store])

  const stopSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await apiCall('/simulation/stop', {
        method: 'POST',
      })

      if (response.success) {
        store.setStatus('idle')
        store.setEndTime(new Date().toISOString())
      } else {
        store.setError(response.error || 'Failed to stop simulation')
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiCall, store])

  const pauseSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await apiCall('/simulation/pause', {
        method: 'POST',
      })

      if (response.success) {
        store.setStatus('paused')
      } else {
        store.setError(response.error || 'Failed to pause simulation')
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiCall, store])

  const resumeSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await apiCall('/simulation/resume', {
        method: 'POST',
      })

      if (response.success) {
        store.setStatus('running')
      } else {
        store.setError(response.error || 'Failed to resume simulation')
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiCall, store])

  const getStatus = useCallback(async () => {
    try {
      const response = await apiCall<{
        status: string
        current_turn: number
        timeline: any[]
      }>('/simulation/status')

      if (response.success && response.data) {
        store.setStatus(response.data.status as any)
        store.setCurrentTurn(response.data.current_turn)
        store.updateTimeline(response.data.timeline)
      }
    } catch (error) {
      console.error('Failed to get status:', error)
    }
  }, [apiCall, store])

  const getCharacters = useCallback(async () => {
    try {
      const response = await apiCall<Character[]>('/characters')

      if (response.success && response.data) {
        store.setCharacters(response.data)
        return response.data
      }
      return []
    } catch (error) {
      console.error('Failed to get characters:', error)
      return []
    }
  }, [apiCall, store])

  const getFiles = useCallback(async (type: 'prompts' | 'configs') => {
    try {
      const response = await apiCall<FileInfo[]>(`/files/${type}`)
      return response.success ? response.data || [] : []
    } catch (error) {
      console.error(`Failed to get ${type}:`, error)
      return []
    }
  }, [apiCall])

  const updateFile = useCallback(async (
    type: 'prompts' | 'configs',
    filename: string,
    content: string
  ) => {
    setLoading(true)
    
    try {
      const response = await apiCall(`/files/${type}/${filename}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })

      if (!response.success) {
        store.setError(response.error || 'Failed to update file')
      }
      
      return response.success
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }, [apiCall, store])

  return {
    loading,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    getStatus,
    getCharacters,
    getFiles,
    updateFile,
  }
} 