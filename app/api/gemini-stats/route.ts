import { type NextRequest, NextResponse } from "next/server"
import { getUsageStats } from "@/lib/gemini-utils"

export async function GET(request: NextRequest) {
  try {
    const stats = getUsageStats()
    
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        status: stats.utilizationPercentage > 90 ? "critical" : 
               stats.utilizationPercentage > 70 ? "warning" : "normal",
        geminiEnabled: process.env.MOCK_MODE !== "true" && 
                      process.env.GEMINI_API_KEY && 
                      process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
      }
    })
  } catch (error) {
    console.error("Gemini統計取得エラー:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "統計取得に失敗しました" 
      },
      { status: 500 }
    )
  }
}
