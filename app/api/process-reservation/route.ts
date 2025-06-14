import { type NextRequest, NextResponse } from "next/server"
import { calculatePriorityScore } from "../../utils/priority-scoring"
import { db } from "@/lib/db"
import { 
  checkRateLimit, 
  incrementUsage, 
  analyzeGeminiError, 
  validateGeminiResponse,
  getUsageStats 
} from "@/lib/gemini-utils"

// フォールバック用の簡易パーサー
function parseWithFallback(text: string) {
  console.log("🔄 [FALLBACK] Gemini APIの代わりに簡易パーサーを使用します")
  
  // 基本的なキーワード検出
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  // GPU種類の検出
  let gpuType = "A100" // デフォルト
  if (text.includes("V100")) gpuType = "V100"
  if (text.includes("RTX4090") || text.includes("4090")) gpuType = "RTX4090"
  if (text.includes("H100")) gpuType = "H100"
  
  // 時間の検出（簡易版）
  let startTime = tomorrow.toISOString()
  let endTime = new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString() // 4時間後
  
  if (text.includes("今日") || text.includes("本日")) {
    startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1時間後
    endTime = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString() // 5時間後
  }
  
  // 緊急度の判定
  let urgencyLevel = "moderate"
  let hasDeadline = false
  
  if (text.includes("緊急") || text.includes("急い") || text.includes("今日中")) {
    urgencyLevel = "urgent"
    hasDeadline = true
  }
  if (text.includes("論文") || text.includes("発表") || text.includes("締切")) {
    hasDeadline = true
  }
  
  // 研究分野の判定
  let researchField = "basic_research"
  if (text.includes("医療") || text.includes("医学")) researchField = "medical"
  if (text.includes("災害") || text.includes("防災")) researchField = "disaster_prevention"
  if (text.includes("気候") || text.includes("環境")) researchField = "climate_change"
  
  // 用途の判定
  let usageType = "model_training"
  if (text.includes("実験")) usageType = "research_experiment"
  if (text.includes("学習") || text.includes("勉強")) usageType = "learning"
  if (text.includes("分析")) usageType = "data_analysis"
  
  return {
    gpuType,
    startTime,
    endTime,
    purpose: text.length > 100 ? text.substring(0, 100) + "..." : text,
    priorityFactors: {
      deadline: {
        hasDeadline,
        daysUntilDeadline: hasDeadline ? 1 : 7,
        deadlineType: text.includes("論文") ? "paper_submission" : "other",
        urgencyLevel
      },
      impact: {
        researchField,
        socialContribution: researchField === "medical" ? "high" : "medium",
        academicNovelty: text.includes("新しい") || text.includes("革新") ? "significant" : "incremental",
        publicationTarget: text.includes("論文") ? "major_conference" : "none"
      },
      funding: {
        hasExternalFunding: text.includes("科研費") || text.includes("資金"),
        fundingType: text.includes("科研費") ? "government_grant" : "internal",
        projectScale: "medium",
        collaborationType: "internal"
      },
      purpose: {
        usageType,
        dataConfidentiality: "public",
        reproducibilityRequirement: "moderate",
        computationalComplexity: text.includes("大量") || text.includes("高速") ? "high" : "medium"
      },
      user: {
        position: "phd_student", // デフォルト値
        researchExperience: "intermediate",
        pastUsageEfficiency: "average",
        labPriority: "medium"
      }
    }
  }
}

// Gemini APIを使用した自然言語処理（フォールバック付き）
async function processWithGemini(text: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const isMockMode = process.env.MOCK_MODE === "true"

  // モックモードまたはAPIキー未設定の場合はフォールバックを使用
  if (isMockMode || !GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.log("🔄 [MOCK/FALLBACK] 簡易パーサーを使用します")
    return parseWithFallback(text)
  }

  // レート制限チェック
  const rateLimitCheck = checkRateLimit()
  if (!rateLimitCheck.allowed) {
    console.log(`⚠️ レート制限: ${rateLimitCheck.reason}`)
    const stats = getUsageStats()
    console.log(`📊 使用状況: ${stats.requestCount}/${stats.dailyLimit} (${stats.utilizationPercentage}%)`)
    return parseWithFallback(text)
  }

  console.log("🤖 [GEMINI] Gemini APIで処理開始...")
  incrementUsage()

  const currentDate = new Date()
  const prompt = `GPU予約システムのAIアシスタントとして、以下の日本語テキストからGPU予約情報を抽出し、JSON形式で返してください。

📅 現在日時: ${currentDate.toISOString()}
💬 ユーザー入力: "${text}"

以下のJSONスキーマに厳密に従って出力してください（余計なテキストは一切含めない）：

\`\`\`json
{
  "gpuType": "A100|V100|RTX4090|H100",
  "startTime": "ISO8601形式",
  "endTime": "ISO8601形式", 
  "purpose": "目的の要約（50文字以内）",
  "priorityFactors": {
    "deadline": {
      "hasDeadline": boolean,
      "daysUntilDeadline": number,
      "deadlineType": "paper_submission|conference_presentation|project_delivery|thesis_defense|other",
      "urgencyLevel": "immediate|urgent|moderate|flexible"
    },
    "impact": {
      "researchField": "medical|disaster_prevention|climate_change|ai_safety|basic_research|engineering|other",
      "socialContribution": "high|medium|low",
      "academicNovelty": "breakthrough|significant|incremental|learning",
      "publicationTarget": "top_tier|major_conference|journal|workshop|none"
    },
    "funding": {
      "hasExternalFunding": boolean,
      "fundingType": "government_grant|industry_collaboration|international_project|internal|personal",
      "projectScale": "large|medium|small",
      "collaborationType": "multi_institutional|industry_academia|international|internal|individual"
    },
    "purpose": {
      "usageType": "research_experiment|model_training|data_analysis|reproduction|learning|testing",
      "dataConfidentiality": "confidential|sensitive|public",
      "reproducibilityRequirement": "critical|important|moderate|low",
      "computationalComplexity": "high|medium|low"
    },
    "user": {
      "position": "professor|associate_professor|assistant_professor|postdoc|phd_student|master_student|undergraduate|staff",
      "researchExperience": "senior|intermediate|junior",
      "pastUsageEfficiency": "excellent|good|average|poor",
      "labPriority": "high|medium|low"
    }
  }
}
\`\`\`

🎯 解析ルール:
• 時間: "明日"→+24h, "今日"→+1h, "来週"→+7日, "午後2時"→14:00
• 緊急度: "今日中"=immediate, "急ぎ"=urgent, "普通"=moderate
• 研究分野: 医療・災害・環境=高インパクト, 基礎研究=中インパクト
• 資金: 科研費・企業連携=外部資金, それ以外=内部資金
• 用途: 実験>訓練>分析>学習の優先度順

デフォルト値: gpuType=A100, position=phd_student, 全般的に中程度の設定`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("🚫 Gemini API HTTPエラー:", response.status, errorData)
      
      // レート制限の場合
      if (response.status === 429) {
        console.log("⏰ Gemini API レート制限に達しました。フォールバックを使用")
      }
      return parseWithFallback(text)
    }

    const data = await response.json()
    
    // エラーレスポンスのチェック
    if (data.error) {
      console.error("🚫 Gemini APIエラー:", data.error)
      return parseWithFallback(text)
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.log("⚠️ Gemini APIからレスポンス本文なし、フォールバックを使用")
      return parseWithFallback(text)
    }

    console.log("📝 Gemini APIレスポンス:", generatedText.substring(0, 200) + "...")

    // JSONを抽出（複数のパターンに対応）
    let jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    }
    
    if (!jsonMatch) {
      console.log("⚠️ Gemini APIのレスポンスにJSONが見つかりません、フォールバックを使用")
      return parseWithFallback(text)
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    
    // 必須フィールドの検証
    if (!parsed.priorityFactors || !parsed.priorityFactors.user) {
      console.log("⚠️ 必須フィールドが不足しています。フォールバックを使用")
      return parseWithFallback(text)
    }

    console.log("✅ Gemini APIで正常に処理されました")
    return parsed
    
  } catch (error) {
    console.error("💥 Gemini API処理エラー:", error)
    
    if (error instanceof SyntaxError) {
      console.log("📋 JSON解析エラー、フォールバックを使用")
    } else {
      console.log("🔌 ネットワークまたはその他のエラー、フォールバックを使用")
    }
    
    return parseWithFallback(text)
  }
}

// 競合チェック関数
async function checkConflicts(gpuType: string, startTime: string, endTime: string) {
  try {
    const conflicts = await db.getConflictingReservations(gpuType, startTime, endTime)
    return conflicts
  } catch (error) {
    console.error("競合チェックエラー:", error)
    return []
  }
}

// 予約データの作成と保存
async function createReservation(reservationData: any, userId: string, userName: string) {
  try {
    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const reservation = await db.createReservation({
      id: reservationId,
      userId,
      userName,
      gpuType: reservationData.gpuType,
      startTime: reservationData.startTime,
      endTime: reservationData.endTime,
      purpose: reservationData.purpose,
      priority: reservationData.priority,
      status: "pending", // 初期状態は承認待ち
      aiReason: reservationData.reason,
      priorityScore: reservationData.priorityScore.percentage || 50,
      priorityFactors: reservationData.priorityFactors,
    })

    return reservation
  } catch (error) {
    console.error("予約作成エラー:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, userId = "user-001", userName = "テストユーザー" } = await request.json()

    if (!text) {
      return NextResponse.json({ success: false, error: "入力テキストが必要です" }, { status: 400 })
    }

    // Gemini APIで自然言語処理
    const processedData = await processWithGemini(text)

    // 優先度スコアを計算
    const priorityScore = calculatePriorityScore(processedData.priorityFactors)

    const reservationData = {
      gpuType: processedData.gpuType || "A100",
      startTime: processedData.startTime || new Date().toISOString(),
      endTime: processedData.endTime || new Date(Date.now() + 3600000).toISOString(),
      purpose: processedData.purpose || text,
      priority: priorityScore.priority,
      reason: `AI優先度判定: ${Math.round(priorityScore.percentage)}% (${priorityScore.priority === "high" ? "高優先度" : priorityScore.priority === "medium" ? "中優先度" : "低優先度"})`,
      priorityScore: priorityScore,
      priorityFactors: processedData.priorityFactors,
    }

    // 競合チェック
    const conflicts = await checkConflicts(
      reservationData.gpuType,
      reservationData.startTime,
      reservationData.endTime
    )

    // 予約をデータベースに保存
    const savedReservation = await createReservation(reservationData, userId, userName)

    // 競合がある場合の自動判定ロジック
    if (conflicts.length > 0) {
      const hasHigherPriority = conflicts.some(
        conflict => conflict.priorityScore < reservationData.priorityScore.percentage
      )
      
      if (hasHigherPriority) {
        // より高い優先度の場合、競合する予約に拒否確認リクエストを送信
        for (const conflict of conflicts) {
          if (conflict.priorityScore < reservationData.priorityScore.percentage) {
            const rejectionId = `rej-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            await db.createRejectionRequest({
              id: rejectionId,
              originalReservationId: savedReservation.id,
              conflictingReservationId: conflict.id,
              requestingUserId: userId,
              targetUserId: conflict.userId,
              reason: `より高い優先度の予約要求があります。${reservationData.reason}`,
              status: "pending",
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後期限切れ
            })
          }
        }
      }
    }

    // 高優先度で競合なしの場合は自動承認
    if (reservationData.priority === "high" && conflicts.length === 0) {
      await db.updateReservationStatus(savedReservation.id, "approved", "高優先度のため自動承認")
    }

    return NextResponse.json({
      success: true,
      reservation: savedReservation,
      conflicts: conflicts,
      autoApproved: reservationData.priority === "high" && conflicts.length === 0,
      ...reservationData,
    })
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "予約処理中にエラーが発生しました" 
    }, { status: 500 })
  }
}
