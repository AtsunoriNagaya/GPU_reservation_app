// Gemini API ユーティリティとレート制限管理

interface APIUsageStats {
  requestCount: number
  lastReset: number
  dailyLimit: number
  monthlyLimit: number
}

// 簡易的なレート制限追跡（本番環境ではRedisやデータベースを使用推奨）
let apiUsage: APIUsageStats = {
  requestCount: 0,
  lastReset: Date.now(),
  dailyLimit: 1500, // Gemini API無料枠の日次制限
  monthlyLimit: 50000, // 月次制限
}

export function checkRateLimit(): { allowed: boolean; reason?: string } {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  // 日次リセット
  if (now - apiUsage.lastReset > oneDay) {
    apiUsage.requestCount = 0
    apiUsage.lastReset = now
  }

  // 制限チェック
  if (apiUsage.requestCount >= apiUsage.dailyLimit) {
    return {
      allowed: false,
      reason: `日次制限に達しました (${apiUsage.dailyLimit}回/日)`
    }
  }

  return { allowed: true }
}

export function incrementUsage() {
  apiUsage.requestCount++
  console.log(`📊 Gemini API使用回数: ${apiUsage.requestCount}/${apiUsage.dailyLimit} (今日)`)
}

export function getUsageStats() {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const hoursUntilReset = Math.ceil((oneDay - (now - apiUsage.lastReset)) / (1000 * 60 * 60))
  
  return {
    requestCount: apiUsage.requestCount,
    dailyLimit: apiUsage.dailyLimit,
    remainingRequests: apiUsage.dailyLimit - apiUsage.requestCount,
    hoursUntilReset,
    utilizationPercentage: Math.round((apiUsage.requestCount / apiUsage.dailyLimit) * 100)
  }
}

// Gemini APIエラーの詳細分析
export function analyzeGeminiError(error: any): {
  type: 'rate_limit' | 'quota_exceeded' | 'invalid_key' | 'network' | 'parse_error' | 'unknown'
  message: string
  shouldRetry: boolean
  fallbackRecommended: boolean
} {
  const errorMessage = error?.message || error?.toString() || ''
  const statusCode = error?.response?.status

  // レート制限
  if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
    return {
      type: 'rate_limit',
      message: 'API使用量制限に達しました',
      shouldRetry: false,
      fallbackRecommended: true
    }
  }

  // 認証エラー
  if (statusCode === 401 || statusCode === 403 || errorMessage.includes('API key')) {
    return {
      type: 'invalid_key',
      message: 'APIキーが無効です',
      shouldRetry: false,
      fallbackRecommended: true
    }
  }

  // ネットワークエラー
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || statusCode >= 500) {
    return {
      type: 'network',
      message: 'ネットワークエラーまたはサーバーエラー',
      shouldRetry: true,
      fallbackRecommended: true
    }
  }

  // JSON解析エラー
  if (error instanceof SyntaxError || errorMessage.includes('JSON')) {
    return {
      type: 'parse_error',
      message: 'レスポンスの解析に失敗しました',
      shouldRetry: false,
      fallbackRecommended: true
    }
  }

  return {
    type: 'unknown',
    message: '不明なエラーが発生しました',
    shouldRetry: false,
    fallbackRecommended: true
  }
}

// プロンプトの最適化
export function optimizePromptForFreeModel(originalPrompt: string): string {
  // 無料版での効率的なプロンプト
  return originalPrompt
    .replace(/\n\s*\n/g, '\n') // 空行を削除
    .trim()
}

// レスポンスの品質チェック
export function validateGeminiResponse(response: any): {
  isValid: boolean
  errors: string[]
  confidence: number
} {
  const errors: string[] = []
  let confidence = 100

  // 必須フィールドのチェック
  if (!response.gpuType) {
    errors.push('gpuTypeが不足しています')
    confidence -= 20
  }

  if (!response.startTime || !response.endTime) {
    errors.push('時間情報が不足しています')
    confidence -= 30
  }

  if (!response.priorityFactors) {
    errors.push('優先度要素が不足しています')
    confidence -= 50
  } else {
    // 優先度要素の詳細チェック
    const required = ['deadline', 'impact', 'funding', 'purpose', 'user']
    for (const field of required) {
      if (!response.priorityFactors[field]) {
        errors.push(`priorityFactors.${field}が不足しています`)
        confidence -= 10
      }
    }
  }

  // 時間の論理チェック
  if (response.startTime && response.endTime) {
    const start = new Date(response.startTime)
    const end = new Date(response.endTime)
    
    if (start >= end) {
      errors.push('開始時刻が終了時刻より後になっています')
      confidence -= 25
    }

    if (start < new Date()) {
      errors.push('開始時刻が過去の時刻です')
      confidence -= 15
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    confidence: Math.max(0, confidence)
  }
}

export default {
  checkRateLimit,
  incrementUsage,
  getUsageStats,
  analyzeGeminiError,
  optimizePromptForFreeModel,
  validateGeminiResponse,
}
