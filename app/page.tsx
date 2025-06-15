"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Send, Server, Clock, User, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./contexts/auth-context"
import LoginForm from "./components/login-form"
import { Reservation } from "@/lib/db"

// 動的インポートでSSRを無効化
const Dashboard = dynamic(() => import("./dashboard/page"), { ssr: false })
const ReservationList = dynamic(() => import("./components/reservation-list"), { ssr: false })
const ConfirmationDialog = dynamic(() => import("./components/confirmation-dialog"), { ssr: false })
const RejectionConfirmation = dynamic(() => import("./components/rejection-confirmation"), { ssr: false })
const MyReservations = dynamic(() => import("./components/my-reservations"), { ssr: false })

export default function GPUReservationSystem() {
  const { user, logout, isLoading } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<"reserve" | "dashboard" | "list" | "rejections" | "my-reservations">(
    "reserve",
  )
  const { toast } = useToast()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingReservation, setPendingReservation] = useState<any>(null)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [pendingRejections, setPendingRejections] = useState<any[]>([])

  // 音声認識の初期化
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "ja-JP"

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
        toast({
          title: "音声認識エラー",
          description: "音声認識に失敗しました。もう一度お試しください。",
          variant: "destructive",
        })
      }
      ;(window as any).speechRecognition = recognition
    }
  }, [toast])

  const startListening = () => {
    if ((window as any).speechRecognition) {
      setIsListening(true)
      ;(window as any).speechRecognition.start()
    }
  }

  const stopListening = () => {
    if ((window as any).speechRecognition) {
      setIsListening(false)
      ;(window as any).speechRecognition.stop()
    }
  }

  const processReservation = async () => {
    if (!transcript.trim()) {
      toast({
        title: "入力エラー",
        description: "予約内容を入力してください。",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "認証エラー",
        description: "ログインが必要です。",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/process-reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: transcript,
          userId: user.id,
          userName: user.name 
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPendingReservation(result)
        setConflicts(result.conflicts || [])
        setShowConfirmation(true)
        
        // 予約一覧を更新
        await fetchReservations()
      } else {
        toast({
          title: "処理エラー",
          description: result.error || "予約処理に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "システムエラー",
        description: "システムエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 予約一覧の取得
  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/reservations")
      const result = await response.json()
      
      if (result.success) {
        setReservations(result.reservations)
      }
    } catch (error) {
      console.error("予約一覧取得エラー:", error)
    }
  }

  // 拒否確認の取得
  const fetchPendingRejections = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/rejections?userId=${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        setPendingRejections(result.rejections)
      }
    } catch (error) {
      console.error("拒否確認取得エラー:", error)
    }
  }

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      fetchReservations()
      fetchPendingRejections()
    }
  }, [user])

  const checkForConflicts = (newReservation: any, existingReservations: Reservation[]) => {
    const newStart = new Date(newReservation.startTime)
    const newEnd = new Date(newReservation.endTime)

    return existingReservations.filter((reservation) => {
      if (reservation.gpuType !== newReservation.gpuType) return false
      if (reservation.status === "rejected") return false

      const existingStart = new Date(reservation.startTime)
      const existingEnd = new Date(reservation.endTime)

      // 時間の重複をチェック
      return newStart < existingEnd && newEnd > existingStart
    })
  }

  const confirmReservation = () => {
    if (!pendingReservation || !user) return

    // 予約は既にAPIで作成されているため、確認ダイアログを閉じるだけ
    setTranscript("")
    setShowConfirmation(false)
    setPendingReservation(null)
    setConflicts([])

    toast({
      title: "予約処理完了",
      description: `予約が申請されました。${conflicts.length > 0 ? "競合があるため管理者による確認が必要です。" : ""}`,
    })

    // 予約一覧を再取得
    fetchReservations()
  }

  const cancelReservation = () => {
    setShowConfirmation(false)
    setPendingReservation(null)
    setConflicts([])
    setIsProcessing(false)
  }

  // 認証チェック
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GPU予約システム</h1>
            <p className="text-gray-600">自然言語・音声入力対応のインテリジェント予約システム</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">ようこそ、{user.name}さん</span>
            <Button variant="outline" onClick={logout}>
              ログアウト
            </Button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={activeTab === "reserve" ? "default" : "ghost"}
              onClick={() => setActiveTab("reserve")}
              className="mr-1"
            >
              <Server className="w-4 h-4 mr-2" />
              予約申請
            </Button>
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              onClick={() => setActiveTab("dashboard")}
              className="mr-1"
            >
              <Clock className="w-4 h-4 mr-2" />
              ダッシュボード
            </Button>
            <Button variant={activeTab === "list" ? "default" : "ghost"} onClick={() => setActiveTab("list")}>
              <User className="w-4 h-4 mr-2" />
              予約一覧
            </Button>
            <Button
              variant={activeTab === "rejections" ? "default" : "ghost"}
              onClick={() => setActiveTab("rejections")}
              className="mr-1"
            >
              拒否確認 {pendingRejections.length > 0 && <Badge className="ml-1">{pendingRejections.length}</Badge>}
            </Button>
            <Button
              variant={activeTab === "my-reservations" ? "default" : "ghost"}
              onClick={() => setActiveTab("my-reservations")}
            >
              マイ予約
            </Button>
          </div>
        </div>

        {/* 予約申請タブ */}
        {activeTab === "reserve" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  音声・テキスト入力
                </CardTitle>
                <CardDescription>自然言語でGPU予約を申請してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isListening ? "録音停止" : "音声入力"}
                  </Button>
                  {isListening && (
                    <Badge variant="destructive" className="animate-pulse">
                      録音中...
                    </Badge>
                  )}
                </div>

                <Textarea
                  placeholder="例: 明日の午後2時から4時まで、機械学習の実験でA100を使いたいです"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={4}
                  className="resize-none"
                />

                <Button onClick={processReservation} disabled={isProcessing || !transcript.trim()} className="w-full">
                  {isProcessing ? (
                    <>処理中...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      予約申請
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  使用例
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <strong>基本的な予約:</strong>
                    <br />
                    「明日の10時から12時まで、深層学習の実験でV100を使いたいです」
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <strong>緊急度指定:</strong>
                    <br />
                    「今日中に論文の実験を完了させる必要があります。A100を4時間使用したいです」
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <strong>詳細指定:</strong>
                    <br />
                    「来週月曜日の朝9時から、画像認識モデルの訓練でGPUクラスターを6時間予約したいです」
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ダッシュボードタブ */}
        {activeTab === "dashboard" && <Dashboard />}

        {/* 予約一覧タブ */}
        {activeTab === "list" && <ReservationList reservations={reservations as any} setReservations={setReservations as any} />}

        {activeTab === "rejections" && (
          <RejectionConfirmation
            pendingRejections={pendingRejections}
            onAcceptRejection={(id, reason) => {
              // 拒否承諾処理
              setPendingRejections((prev) => prev.filter((r) => r.id !== id))
            }}
            onDeclineRejection={(id, reason) => {
              // 拒否拒否処理
              setPendingRejections((prev) => prev.filter((r) => r.id !== id))
            }}
          />
        )}

        {activeTab === "my-reservations" && (
          <MyReservations
            reservations={reservations as any}
            currentUserId={user.id}
            onCancelReservation={(id) => {
              setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r)))
            }}
          />
        )}
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={cancelReservation}
          onConfirm={confirmReservation}
          reservationData={pendingReservation}
          conflicts={conflicts}
          isProcessing={false}
        />
      </div>
    </div>
  )
}
