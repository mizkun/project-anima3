import React, { useState } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { ChevronDown, Cpu, Zap } from 'lucide-react'

interface ModelOption {
  provider: 'openai' | 'gemini'
  model: string
  displayName: string
  description: string
}

interface ModelSelectorProps {
  selectedProvider: string
  selectedModel: string
  onModelChange: (provider: string, model: string) => void
  disabled?: boolean
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    provider: 'openai',
    model: 'gpt-4',
    displayName: 'GPT-4',
    description: 'OpenAI GPT-4 - 高性能・高精度'
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    description: 'OpenAI GPT-3.5 - 高速・コスト効率'
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Google Gemini - 高速・多機能'
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Google Gemini Pro - 高性能・長文対応'
  }
]

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const selectedOption = MODEL_OPTIONS.find(
    option => option.provider === selectedProvider && option.model === selectedModel
  )

  const handleModelChange = async (provider: string, model: string) => {
    setIsChanging(true)
    try {
      const response = await fetch('/api/simulation/model', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, model }),
      })

      if (response.ok) {
        onModelChange(provider, model)
        setIsOpen(false)
      } else {
        console.error('モデル切り替えに失敗しました')
      }
    } catch (error) {
      console.error('モデル切り替えエラー:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <Zap className="h-4 w-4 text-green-400" />
      case 'gemini':
        return <Cpu className="h-4 w-4 text-blue-400" />
      default:
        return <Cpu className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">LLMモデル</label>
      
      <div className="relative">
        <NeumorphismButton
          variant="secondary"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isChanging}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {selectedOption && getProviderIcon(selectedOption.provider)}
            <span className="text-sm">
              {selectedOption ? selectedOption.displayName : 'モデルを選択'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </NeumorphismButton>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-10">
            <div className="neumorphism-card rounded-xl p-2 max-h-60 overflow-y-auto">
              {MODEL_OPTIONS.map((option) => (
                <button
                  key={`${option.provider}-${option.model}`}
                  onClick={() => handleModelChange(option.provider, option.model)}
                  disabled={isChanging}
                  className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-700/50 ${
                    selectedProvider === option.provider && selectedModel === option.model
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getProviderIcon(option.provider)}
                    <span className="font-medium text-sm text-gray-200">{option.displayName}</span>
                  </div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedOption && (
        <div className="neumorphism-inset rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">現在のモデル</div>
          <div className="flex items-center gap-2">
            {getProviderIcon(selectedOption.provider)}
            <span className="text-sm text-gray-200 font-medium">{selectedOption.displayName}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{selectedOption.description}</div>
        </div>
      )}
    </div>
  )
} 