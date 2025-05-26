import React from 'react'
import { Brain, Activity, MessageCircle } from 'lucide-react'

interface ActionDisplayProps {
  actionType: 'speak' | 'think' | 'act'
  content: string
}

export const ActionDisplay: React.FC<ActionDisplayProps> = ({ 
  actionType, 
  content 
}) => {
  const getActionConfig = (type: 'speak' | 'think' | 'act') => {
    switch (type) {
      case 'think':
        return {
          icon: Brain,
          color: 'purple',
          label: '思考',
          colorClass: 'text-purple-600',
          labelClass: 'text-purple-700'
        }
      case 'act':
        return {
          icon: Activity,
          color: 'green',
          label: '行動',
          colorClass: 'text-green-600',
          labelClass: 'text-green-700'
        }
      case 'speak':
        return {
          icon: MessageCircle,
          color: 'blue',
          label: '発言',
          colorClass: 'text-blue-600',
          labelClass: 'text-blue-700'
        }
    }
  }

  const config = getActionConfig(actionType)
  const IconComponent = config.icon

  return (
    <div className="space-y-3">
      <div className="neumorphism-inset rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="neumorphism-icon p-2 flex-shrink-0">
            <IconComponent className={`h-4 w-4 ${config.colorClass}`} />
          </div>
          <div className="flex-1">
            <h5 className={`text-sm font-semibold ${config.labelClass} mb-1`}>
              {config.label}
            </h5>
            {actionType === 'speak' ? (
              <div className="bg-white bg-opacity-50 rounded-lg p-3 border-l-4 border-blue-300">
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "{content}"
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 