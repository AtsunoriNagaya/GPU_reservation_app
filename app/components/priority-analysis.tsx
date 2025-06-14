"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Target, DollarSign, BookOpen, User, AlertTriangle, CheckCircle, Info, TrendingUp } from "lucide-react"
import type { PriorityScore, PriorityFactors } from "../utils/priority-scoring"

interface PriorityAnalysisProps {
  score: PriorityScore
  factors: PriorityFactors
  showDetails?: boolean
}

export default function PriorityAnalysis({ score, factors, showDetails = true }: PriorityAnalysisProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "medium":
        return <Info className="w-4 h-4" />
      case "low":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const formatFactorValue = (category: string, key: string, value: any): string => {
    // 各カテゴリの値を日本語に変換
    const translations: { [key: string]: { [value: string]: string } } = {
      deadline: {
        immediate: "即座",
        urgent: "緊急",
        moderate: "中程度",
        flexible: "柔軟",
        paper_submission: "論文投稿",
        conference_presentation: "学会発表",
        project_delivery: "プロジェクト納期",
        thesis_defense: "論文審査",
        other: "その他",
        none: "なし",
      },
      impact: {
        medical: "医療",
        disaster_prevention: "災害予防",
        climate_change: "気候変動",
        ai_safety: "AI安全性",
        basic_research: "基礎研究",
        engineering: "工学",
        other: "その他",
        high: "高",
        medium: "中",
        low: "低",
        breakthrough: "画期的",
        significant: "重要",
        incremental: "段階的",
        learning: "学習",
        top_tier: "トップティア",
        major_conference: "主要学会",
        journal: "学術誌",
        workshop: "ワークショップ",
        none: "なし",
      },
      funding: {
        government_grant: "政府系研究費",
        industry_collaboration: "産学連携",
        international_project: "国際プロジェクト",
        internal: "内部資金",
        personal: "個人",
        large: "大規模",
        medium: "中規模",
        small: "小規模",
        multi_institutional: "複数機関",
        industry_academia: "産学連携",
        international: "国際",
        individual: "個人",
      },
      purpose: {
        research_experiment: "研究実験",
        model_training: "モデル訓練",
        data_analysis: "データ解析",
        reproduction: "再現実験",
        learning: "学習",
        testing: "テスト",
        confidential: "機密",
        sensitive: "センシティブ",
        public: "公開",
        critical: "重要",
        important: "重要",
        moderate: "中程度",
      },
      user: {
        professor: "教授",
        associate_professor: "准教授",
        assistant_professor: "助教",
        postdoc: "ポスドク",
        phd_student: "博士課程",
        master_student: "修士課程",
        undergraduate: "学部生",
        staff: "職員",
        senior: "上級",
        intermediate: "中級",
        junior: "初級",
        excellent: "優秀",
        good: "良好",
        average: "平均",
        poor: "要改善",
      },
    }

    return translations[category]?.[value] || value
  }

  return (
    <div className="space-y-6">
      {/* 総合スコア */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI優先度判定結果
          </CardTitle>
          <CardDescription>自然言語処理と多角的分析による優先度スコア</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={getPriorityColor(score.priority) as any} className="text-lg px-4 py-2">
                  {getPriorityIcon(score.priority)}
                  <span className="ml-2">
                    {score.priority === "high" ? "高優先度" : score.priority === "medium" ? "中優先度" : "低優先度"}
                  </span>
                </Badge>
                <div className="text-2xl font-bold">{Math.round(score.percentage)}%</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(score.totalScore)}/{score.maxScore} ポイント
              </div>
            </div>

            <Progress value={score.percentage} className="h-3" />

            {/* 判定理由 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">判定理由:</h4>
              <ul className="space-y-1">
                {score.reasoning.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細スコア内訳 */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 時間的緊急性 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                時間的緊急性
              </CardTitle>
              <CardDescription className="text-xs">
                重み: 30% | スコア: {Math.round(score.breakdown.deadline)}pt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(score.breakdown.deadline / 30) * 100} className="h-2" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>締切の有無:</span>
                  <span>{factors.deadline.hasDeadline ? "あり" : "なし"}</span>
                </div>
                <div className="flex justify-between">
                  <span>緊急度:</span>
                  <span>{formatFactorValue("deadline", "urgencyLevel", factors.deadline.urgencyLevel)}</span>
                </div>
                <div className="flex justify-between">
                  <span>締切種別:</span>
                  <span>{formatFactorValue("deadline", "deadlineType", factors.deadline.deadlineType)}</span>
                </div>
                {factors.deadline.daysUntilDeadline && (
                  <div className="flex justify-between">
                    <span>残り日数:</span>
                    <span>{factors.deadline.daysUntilDeadline}日</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 社会的・学術的インパクト */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                インパクト
              </CardTitle>
              <CardDescription className="text-xs">
                重み: 25% | スコア: {Math.round(score.breakdown.impact)}pt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(score.breakdown.impact / 25) * 100} className="h-2" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>研究分野:</span>
                  <span>{formatFactorValue("impact", "researchField", factors.impact.researchField)}</span>
                </div>
                <div className="flex justify-between">
                  <span>社会貢献度:</span>
                  <span>{formatFactorValue("impact", "socialContribution", factors.impact.socialContribution)}</span>
                </div>
                <div className="flex justify-between">
                  <span>学術的新規性:</span>
                  <span>{formatFactorValue("impact", "academicNovelty", factors.impact.academicNovelty)}</span>
                </div>
                <div className="flex justify-between">
                  <span>発表予定:</span>
                  <span>{formatFactorValue("impact", "publicationTarget", factors.impact.publicationTarget)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 資金・プロジェクト性質 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                資金・プロジェクト
              </CardTitle>
              <CardDescription className="text-xs">
                重み: 20% | スコア: {Math.round(score.breakdown.funding)}pt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(score.breakdown.funding / 20) * 100} className="h-2" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>外部資金:</span>
                  <span>{factors.funding.hasExternalFunding ? "あり" : "なし"}</span>
                </div>
                <div className="flex justify-between">
                  <span>資金種別:</span>
                  <span>{formatFactorValue("funding", "fundingType", factors.funding.fundingType)}</span>
                </div>
                <div className="flex justify-between">
                  <span>規模:</span>
                  <span>{formatFactorValue("funding", "projectScale", factors.funding.projectScale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>協力形態:</span>
                  <span>{formatFactorValue("funding", "collaborationType", factors.funding.collaborationType)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 利用目的・性質 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                利用目的
              </CardTitle>
              <CardDescription className="text-xs">
                重み: 15% | スコア: {Math.round(score.breakdown.purpose)}pt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(score.breakdown.purpose / 15) * 100} className="h-2" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>利用タイプ:</span>
                  <span>{formatFactorValue("purpose", "usageType", factors.purpose.usageType)}</span>
                </div>
                <div className="flex justify-between">
                  <span>データ機密性:</span>
                  <span>
                    {formatFactorValue("purpose", "dataConfidentiality", factors.purpose.dataConfidentiality)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>再現性要求:</span>
                  <span>
                    {formatFactorValue(
                      "purpose",
                      "reproducibilityRequirement",
                      factors.purpose.reproducibilityRequirement,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>計算複雑度:</span>
                  <span>
                    {formatFactorValue("purpose", "computationalComplexity", factors.purpose.computationalComplexity)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ユーザー属性 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                ユーザー属性
              </CardTitle>
              <CardDescription className="text-xs">
                重み: 10% | スコア: {Math.round(score.breakdown.user)}pt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(score.breakdown.user / 10) * 100} className="h-2" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>職位:</span>
                  <span>{formatFactorValue("user", "position", factors.user.position)}</span>
                </div>
                <div className="flex justify-between">
                  <span>研究経験:</span>
                  <span>{formatFactorValue("user", "researchExperience", factors.user.researchExperience)}</span>
                </div>
                <div className="flex justify-between">
                  <span>利用効率:</span>
                  <span>{formatFactorValue("user", "pastUsageEfficiency", factors.user.pastUsageEfficiency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>研究室優先度:</span>
                  <span>{formatFactorValue("user", "labPriority", factors.user.labPriority)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 改善提案 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">優先度向上のための提案</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {score.priority === "low" && (
              <>
                <p className="text-muted-foreground">• 具体的な締切や緊急性を明示することで優先度が向上します</p>
                <p className="text-muted-foreground">• 研究の社会的意義や学術的価値を詳しく説明してください</p>
                <p className="text-muted-foreground">• 外部資金や共同研究の情報があれば追加してください</p>
              </>
            )}
            {score.priority === "medium" && (
              <>
                <p className="text-muted-foreground">
                  • 締切の詳細や緊急性をより具体的に説明することで高優先度になる可能性があります
                </p>
                <p className="text-muted-foreground">• 研究成果の発表予定や社会的インパクトを強調してください</p>
              </>
            )}
            {score.priority === "high" && (
              <p className="text-green-600">• 高優先度として判定されました。迅速な処理が期待されます</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
