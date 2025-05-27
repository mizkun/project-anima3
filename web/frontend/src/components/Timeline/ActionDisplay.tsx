import React from 'react'
import { Brain, Activity, MessageCircle, Play } from 'lucide-react'

interface ActionDisplayProps {
  actionType: 'turn' | 'intervention'
  content: string
}

export const ActionDisplay: React.FC<ActionDisplayProps> = ({ 
  actionType, 
  content 
}) => {
  if (actionType === 'turn') {
    // ターンの場合、思考・行動・発言を分割して表示
    const lines = content.split('\n')
    const thinkLine = lines.find(line => line.startsWith('思考:'))
    const actLine = lines.find(line => line.startsWith('行動:'))
    const talkLine = lines.find(line => line.startsWith('発言:'))

    return (
      <div className="space-y-3">
        {thinkLine && (
          <div className="neumorphism-inset rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="neumorphism-icon p-2 flex-shrink-0">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-1">思考</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {thinkLine.replace('思考: ', '')}
                </p>
              </div>
            </div>
          </div>
        )}

        {actLine && (
          <div className="neumorphism-inset rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="neumorphism-icon p-2 flex-shrink-0">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">行動</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {actLine.replace('行動: ', '')}
                </p>
              </div>
            </div>
          </div>
        )}

        {talkLine && (
          <div className="neumorphism-inset rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="neumorphism-icon p-2 flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">発言</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {talkLine.replace('発言: ', '')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } else {
    // 介入の場合
    return (
      <div className="space-y-3">
        <div className="neumorphism-inset rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="neumorphism-icon p-2 flex-shrink-0">
              <Play className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">介入</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{content}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
} 