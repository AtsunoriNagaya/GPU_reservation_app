// 優先度判定のスコアリングシステム

export interface PriorityFactors {
  // 時間的緊急性 (30%)
  deadline: {
    hasDeadline: boolean
    daysUntilDeadline?: number
    deadlineType:
      | "paper_submission"
      | "conference_presentation"
      | "project_delivery"
      | "thesis_defense"
      | "other"
      | "none"
    urgencyLevel: "immediate" | "urgent" | "moderate" | "flexible"
  }

  // 社会的・学術的インパクト (25%)
  impact: {
    researchField:
      | "medical"
      | "disaster_prevention"
      | "climate_change"
      | "ai_safety"
      | "basic_research"
      | "engineering"
      | "other"
    socialContribution: "high" | "medium" | "low"
    academicNovelty: "breakthrough" | "significant" | "incremental" | "learning"
    publicationTarget: "top_tier" | "major_conference" | "journal" | "workshop" | "none"
  }

  // 資金・プロジェクト性質 (20%)
  funding: {
    hasExternalFunding: boolean
    fundingType: "government_grant" | "industry_collaboration" | "international_project" | "internal" | "personal"
    projectScale: "large" | "medium" | "small"
    collaborationType: "multi_institutional" | "industry_academia" | "international" | "internal" | "individual"
  }

  // 利用目的・性質 (15%)
  purpose: {
    usageType: "research_experiment" | "model_training" | "data_analysis" | "reproduction" | "learning" | "testing"
    dataConfidentiality: "confidential" | "sensitive" | "public"
    reproducibilityRequirement: "critical" | "important" | "moderate" | "low"
    computationalComplexity: "high" | "medium" | "low"
  }

  // ユーザー属性 (10%)
  user: {
    position:
      | "professor"
      | "associate_professor"
      | "assistant_professor"
      | "postdoc"
      | "phd_student"
      | "master_student"
      | "undergraduate"
      | "staff"
    researchExperience: "senior" | "intermediate" | "junior"
    pastUsageEfficiency: "excellent" | "good" | "average" | "poor"
    labPriority: "high" | "medium" | "low"
  }
}

export interface PriorityScore {
  totalScore: number
  maxScore: number
  percentage: number
  priority: "high" | "medium" | "low"
  breakdown: {
    deadline: number
    impact: number
    funding: number
    purpose: number
    user: number
  }
  reasoning: string[]
}

export function calculatePriorityScore(factors: PriorityFactors): PriorityScore {
  const weights = {
    deadline: 0.3,
    impact: 0.25,
    funding: 0.2,
    purpose: 0.15,
    user: 0.1,
  }

  // 各カテゴリのスコア計算
  const deadlineScore = calculateDeadlineScore(factors.deadline)
  const impactScore = calculateImpactScore(factors.impact)
  const fundingScore = calculateFundingScore(factors.funding)
  const purposeScore = calculatePurposeScore(factors.purpose)
  const userScore = calculateUserScore(factors.user)

  // 重み付き合計スコア
  const totalScore =
    deadlineScore * weights.deadline +
    impactScore * weights.impact +
    fundingScore * weights.funding +
    purposeScore * weights.purpose +
    userScore * weights.user

  const maxScore = 100
  const percentage = (totalScore / maxScore) * 100

  // 優先度判定
  let priority: "high" | "medium" | "low"
  if (percentage >= 75) priority = "high"
  else if (percentage >= 50) priority = "medium"
  else priority = "low"

  // 判定理由の生成
  const reasoning = generateReasoning(factors, {
    deadline: deadlineScore,
    impact: impactScore,
    funding: fundingScore,
    purpose: purposeScore,
    user: userScore,
  })

  return {
    totalScore,
    maxScore,
    percentage,
    priority,
    breakdown: {
      deadline: deadlineScore * weights.deadline,
      impact: impactScore * weights.impact,
      funding: fundingScore * weights.funding,
      purpose: purposeScore * weights.purpose,
      user: userScore * weights.user,
    },
    reasoning,
  }
}

function calculateDeadlineScore(deadline: PriorityFactors["deadline"]): number {
  if (!deadline.hasDeadline) return 20

  let score = 40

  // 締切タイプによる加点
  const deadlineTypeScores = {
    paper_submission: 25,
    conference_presentation: 20,
    project_delivery: 15,
    thesis_defense: 20,
    other: 10,
    none: 0,
  }
  score += deadlineTypeScores[deadline.deadlineType]

  // 緊急度による加点
  const urgencyScores = {
    immediate: 35,
    urgent: 25,
    moderate: 15,
    flexible: 5,
  }
  score += urgencyScores[deadline.urgencyLevel]

  // 締切までの日数による調整
  if (deadline.daysUntilDeadline !== undefined) {
    if (deadline.daysUntilDeadline <= 3) score += 20
    else if (deadline.daysUntilDeadline <= 7) score += 15
    else if (deadline.daysUntilDeadline <= 14) score += 10
    else if (deadline.daysUntilDeadline <= 30) score += 5
  }

  return Math.min(score, 100)
}

function calculateImpactScore(impact: PriorityFactors["impact"]): number {
  let score = 0

  // 研究分野による基礎スコア
  const fieldScores = {
    medical: 30,
    disaster_prevention: 28,
    climate_change: 25,
    ai_safety: 22,
    basic_research: 15,
    engineering: 18,
    other: 10,
  }
  score += fieldScores[impact.researchField]

  // 社会貢献度
  const contributionScores = {
    high: 25,
    medium: 15,
    low: 5,
  }
  score += contributionScores[impact.socialContribution]

  // 学術的新規性
  const noveltyScores = {
    breakthrough: 25,
    significant: 20,
    incremental: 10,
    learning: 5,
  }
  score += noveltyScores[impact.academicNovelty]

  // 発表予定
  const publicationScores = {
    top_tier: 20,
    major_conference: 15,
    journal: 12,
    workshop: 8,
    none: 0,
  }
  score += publicationScores[impact.publicationTarget]

  return Math.min(score, 100)
}

function calculateFundingScore(funding: PriorityFactors["funding"]): number {
  let score = 0

  // 外部資金の有無
  if (funding.hasExternalFunding) {
    score += 30

    // 資金タイプによる加点
    const fundingTypeScores = {
      government_grant: 25,
      industry_collaboration: 20,
      international_project: 22,
      internal: 10,
      personal: 0,
    }
    score += fundingTypeScores[funding.fundingType]
  } else {
    score += 10
  }

  // プロジェクト規模
  const scaleScores = {
    large: 20,
    medium: 12,
    small: 5,
  }
  score += scaleScores[funding.projectScale]

  // 協力形態
  const collaborationScores = {
    multi_institutional: 15,
    industry_academia: 12,
    international: 18,
    internal: 8,
    individual: 3,
  }
  score += collaborationScores[funding.collaborationType]

  return Math.min(score, 100)
}

function calculatePurposeScore(purpose: PriorityFactors["purpose"]): number {
  let score = 0

  // 利用タイプ
  const usageScores = {
    research_experiment: 25,
    model_training: 20,
    data_analysis: 18,
    reproduction: 15,
    learning: 8,
    testing: 10,
  }
  score += usageScores[purpose.usageType]

  // データ機密性
  const confidentialityScores = {
    confidential: 15,
    sensitive: 10,
    public: 5,
  }
  score += confidentialityScores[purpose.dataConfidentiality]

  // 再現性要求
  const reproducibilityScores = {
    critical: 20,
    important: 15,
    moderate: 10,
    low: 5,
  }
  score += reproducibilityScores[purpose.reproducibilityRequirement]

  // 計算複雑度
  const complexityScores = {
    high: 15,
    medium: 10,
    low: 5,
  }
  score += complexityScores[purpose.computationalComplexity]

  return Math.min(score, 100)
}

function calculateUserScore(user: PriorityFactors["user"] | undefined): number {
  // userが未定義の場合はデフォルトスコアを返す
  if (!user) {
    return 50 // 中程度のスコア
  }

  let score = 0

  // 職位
  const positionScores = {
    professor: 25,
    associate_professor: 22,
    assistant_professor: 18,
    postdoc: 15,
    phd_student: 12,
    master_student: 8,
    undergraduate: 5,
    staff: 10,
  }
  score += positionScores[user.position] || 10 // デフォルト値

  // 研究経験
  const experienceScores = {
    senior: 20,
    intermediate: 15,
    junior: 8,
  }
  score += experienceScores[user.researchExperience] || 10 // デフォルト値

  // 過去の利用効率
  const efficiencyScores = {
    excellent: 15,
    good: 12,
    average: 8,
    poor: 3,
  }
  score += efficiencyScores[user.pastUsageEfficiency] || 8 // デフォルト値

  // 研究室優先度
  const labScores = {
    high: 15,
    medium: 10,
    low: 5,
  }
  score += labScores[user.labPriority] || 10 // デフォルト値

  return Math.min(score, 100)
}

function generateReasoning(factors: PriorityFactors, scores: any): string[] {
  const reasoning: string[] = []

  // 締切関連
  if (factors.deadline.hasDeadline) {
    if (factors.deadline.urgencyLevel === "immediate") {
      reasoning.push("緊急の締切があり、即座の対応が必要です")
    } else if (factors.deadline.urgencyLevel === "urgent") {
      reasoning.push("近い締切があり、優先的な処理が必要です")
    }

    if (factors.deadline.deadlineType === "paper_submission") {
      reasoning.push("論文投稿期限が設定されており、学術的成果に直結します")
    }
  }

  // インパクト関連
  if (factors.impact.researchField === "medical") {
    reasoning.push("医療分野の研究であり、社会的インパクトが高いです")
  } else if (factors.impact.researchField === "disaster_prevention") {
    reasoning.push("災害予防に関する研究で、公共の安全に寄与します")
  }

  if (factors.impact.academicNovelty === "breakthrough") {
    reasoning.push("画期的な研究内容で、学術的価値が非常に高いです")
  }

  // 資金関連
  if (factors.funding.hasExternalFunding) {
    if (factors.funding.fundingType === "government_grant") {
      reasoning.push("政府系研究資金による研究で、公的な重要性があります")
    } else if (factors.funding.fundingType === "industry_collaboration") {
      reasoning.push("産学連携プロジェクトで、実用化への期待があります")
    }
  }

  // 目的関連
  if (factors.purpose.usageType === "learning") {
    reasoning.push("学習目的の利用のため、研究用途より優先度は低めです")
  } else if (factors.purpose.usageType === "research_experiment") {
    reasoning.push("研究実験での利用で、学術的成果に直結します")
  }

  // ユーザー関連
  if (factors.user.position === "professor" || factors.user.position === "associate_professor") {
    reasoning.push("上級研究者による利用で、研究指導への影響も考慮されます")
  } else if (factors.user.position === "undergraduate") {
    reasoning.push("学部生による利用のため、教育的配慮が必要です")
  }

  return reasoning
}

// 自然言語からPriorityFactorsを抽出する関数
export function extractPriorityFactors(text: string, userInfo: any): Partial<PriorityFactors> {
  // この関数は実際にはGemini APIで処理されますが、
  // ここではサンプル実装を示します

  const factors: Partial<PriorityFactors> = {
    deadline: {
      hasDeadline: /締切|期限|deadline|urgent|緊急/.test(text.toLowerCase()),
      daysUntilDeadline: 7,
      urgencyLevel: /今日|今すぐ|緊急|immediate/.test(text.toLowerCase())
        ? "immediate"
        : /明日|urgent|急ぎ/.test(text.toLowerCase())
          ? "urgent"
          : /来週|moderate/.test(text.toLowerCase())
            ? "moderate"
            : "flexible",
      deadlineType: /論文|paper/.test(text.toLowerCase())
        ? "paper_submission"
        : /学会|conference/.test(text.toLowerCase())
          ? "conference_presentation"
          : /プロジェクト|project/.test(text.toLowerCase())
            ? "project_delivery"
            : "other",
    },
    impact: {
      researchField: /医療|医学|medical/.test(text.toLowerCase())
        ? "medical"
        : /災害|防災|disaster/.test(text.toLowerCase())
          ? "disaster_prevention"
          : /気候|環境|climate/.test(text.toLowerCase())
            ? "climate_change"
            : /AI|人工知能/.test(text.toLowerCase())
              ? "ai_safety"
              : "basic_research",
      socialContribution: /社会|public|重要/.test(text.toLowerCase()) ? "high" : "medium",
      academicNovelty: /新しい|novel|breakthrough/.test(text.toLowerCase())
        ? "significant"
        : /学習|learning|勉強/.test(text.toLowerCase())
          ? "learning"
          : "incremental",
      publicationTarget: /論文|paper/.test(text.toLowerCase()) ? "major_conference" : "none",
    },
    funding: {
      hasExternalFunding: /科研費|grant|共同研究|collaboration/.test(text.toLowerCase()),
      fundingType: /科研費|government/.test(text.toLowerCase())
        ? "government_grant"
        : /企業|company|industry/.test(text.toLowerCase())
          ? "industry_collaboration"
          : "internal",
      projectScale: "medium",
      collaborationType: "internal",
    },
    purpose: {
      usageType: /実験|experiment/.test(text.toLowerCase())
        ? "research_experiment"
        : /訓練|training/.test(text.toLowerCase())
          ? "model_training"
          : /学習|learning|勉強/.test(text.toLowerCase())
            ? "learning"
            : "research_experiment",
      dataConfidentiality: "public",
      reproducibilityRequirement: "moderate",
      computationalComplexity: "medium",
    },
    user: {
      position: "phd_student",
      researchExperience: "intermediate",
      pastUsageEfficiency: "average",
      labPriority: "medium",
    },
  }

  return factors
}
