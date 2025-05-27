// API層のテスト用ユーティリティ
// ブラウザのコンソールで直接実行してAPIの動作を確認できます

export const testAPI = {
  // シンプルなAPI呼び出しテスト
  async testStatus() {
    try {
      console.log('🔍 ステータス取得テスト開始...')
      const response = await fetch('/api/simulation/status')
      const data = await response.json()
      console.log('✅ ステータス取得成功:', data)
      return data
    } catch (error) {
      console.error('❌ ステータス取得失敗:', error)
      return null
    }
  },

  // シミュレーション開始テスト
  async testStart() {
    try {
      console.log('🔍 シミュレーション開始テスト開始...')
      const config = {
        character_name: 'test',
        llm_provider: 'gemini',
        model_name: 'gemini-1.5-flash',
        max_steps: 5,
        max_turns: 5,
        temperature: 0.7,
        max_tokens: 1000
      }
      
      const response = await fetch('/api/simulation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      })
      
      const data = await response.json()
      console.log('✅ シミュレーション開始成功:', data)
      return data
    } catch (error) {
      console.error('❌ シミュレーション開始失敗:', error)
      return null
    }
  },

  // リセットテスト
  async testReset() {
    try {
      console.log('🔍 リセットテスト開始...')
      const response = await fetch('/api/simulation/reset', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('✅ リセット成功:', data)
      return data
    } catch (error) {
      console.error('❌ リセット失敗:', error)
      return null
    }
  },

  // 全体テスト
  async runAllTests() {
    console.log('🚀 API全体テスト開始')
    console.log('==================')
    
    // 1. ステータス確認
    await this.testStatus()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 2. リセット
    await this.testReset()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 3. ステータス再確認
    await this.testStatus()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 4. 開始テスト
    await this.testStart()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 5. 最終ステータス確認
    await this.testStatus()
    
    console.log('==================')
    console.log('🏁 API全体テスト完了')
  }
}

// グローバルに公開（ブラウザコンソールで使用可能）
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPI
} 