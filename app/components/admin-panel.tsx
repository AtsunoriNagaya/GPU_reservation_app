"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Server, Plus, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GPUServer {
  id: string
  name: string
  gpuType: string
  totalCount: number
  availableCount: number
  location: string
  status: "active" | "maintenance" | "offline"
  specifications: {
    memory: string
    computeCapability: string
    tensorCores: string
  }
}

interface AdminPanelProps {
  servers: GPUServer[]
  onAddServer: (server: Omit<GPUServer, "id">) => void
  onRemoveServer: (id: string) => void
  onUpdateServer: (id: string, updates: Partial<GPUServer>) => void
}

export default function AdminPanel({ servers, onAddServer, onRemoveServer, onUpdateServer }: AdminPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [selectedServer, setSelectedServer] = useState<GPUServer | null>(null)
  const [newServer, setNewServer] = useState({
    name: "",
    gpuType: "",
    totalCount: 1,
    location: "",
    memory: "",
    computeCapability: "",
    tensorCores: "",
  })
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "maintenance":
        return "secondary"
      case "offline":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "稼働中"
      case "maintenance":
        return "メンテナンス"
      case "offline":
        return "オフライン"
      default:
        return status
    }
  }

  const handleAddServer = () => {
    if (!newServer.name || !newServer.gpuType || !newServer.location) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください。",
        variant: "destructive",
      })
      return
    }

    const serverData: Omit<GPUServer, "id"> = {
      name: newServer.name,
      gpuType: newServer.gpuType,
      totalCount: newServer.totalCount,
      availableCount: newServer.totalCount,
      location: newServer.location,
      status: "active",
      specifications: {
        memory: newServer.memory,
        computeCapability: newServer.computeCapability,
        tensorCores: newServer.tensorCores,
      },
    }

    onAddServer(serverData)
    setNewServer({
      name: "",
      gpuType: "",
      totalCount: 1,
      location: "",
      memory: "",
      computeCapability: "",
      tensorCores: "",
    })
    setShowAddDialog(false)

    toast({
      title: "サーバー追加完了",
      description: "新しいGPUサーバーが追加されました。",
    })
  }

  const handleRemoveServer = () => {
    if (selectedServer) {
      onRemoveServer(selectedServer.id)
      setShowRemoveDialog(false)
      setSelectedServer(null)

      toast({
        title: "サーバー削除完了",
        description: "GPUサーバーが削除されました。",
      })
    }
  }

  const handleStatusChange = (serverId: string, newStatus: "active" | "maintenance" | "offline") => {
    onUpdateServer(serverId, { status: newStatus })
    toast({
      title: "ステータス更新",
      description: "サーバーのステータスが更新されました。",
    })
  }

  return (
    <div className="space-y-6">
      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{servers.length}</div>
            <div className="text-sm text-muted-foreground">総サーバー数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {servers.filter((s) => s.status === "active").length}
            </div>
            <div className="text-sm text-muted-foreground">稼働中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {servers.filter((s) => s.status === "maintenance").length}
            </div>
            <div className="text-sm text-muted-foreground">メンテナンス</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {servers.filter((s) => s.status === "offline").length}
            </div>
            <div className="text-sm text-muted-foreground">オフライン</div>
          </CardContent>
        </Card>
      </div>

      {/* サーバー管理ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>GPUサーバー管理</CardTitle>
              <CardDescription>GPUサーバーの追加、削除、ステータス管理</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              サーバー追加
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* サーバー一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => (
          <Card key={server.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    {server.name}
                  </CardTitle>
                  <CardDescription>{server.location}</CardDescription>
                </div>
                <Badge variant={getStatusColor(server.status) as any}>{getStatusText(server.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GPU情報 */}
              <div>
                <div className="text-sm font-medium mb-2">{server.gpuType}</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>メモリ: {server.specifications.memory}</div>
                  <div>計算能力: {server.specifications.computeCapability}</div>
                  <div>Tensor Cores: {server.specifications.tensorCores}</div>
                </div>
              </div>

              {/* 使用状況 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>使用状況</span>
                  <span>
                    {server.totalCount - server.availableCount}/{server.totalCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${((server.totalCount - server.availableCount) / server.totalCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2">
                <select
                  value={server.status}
                  onChange={(e) =>
                    handleStatusChange(server.id, e.target.value as "active" | "maintenance" | "offline")
                  }
                  className="flex-1 text-xs border rounded px-2 py-1"
                >
                  <option value="active">稼働中</option>
                  <option value="maintenance">メンテナンス</option>
                  <option value="offline">オフライン</option>
                </select>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedServer(server)
                    setShowRemoveDialog(true)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* サーバー追加ダイアログ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新しいGPUサーバーを追加</DialogTitle>
            <DialogDescription>サーバーの詳細情報を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">サーバー名 *</Label>
              <Input
                id="name"
                value={newServer.name}
                onChange={(e) => setNewServer((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例: GPU-Server-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpuType">GPUタイプ *</Label>
              <Input
                id="gpuType"
                value={newServer.gpuType}
                onChange={(e) => setNewServer((prev) => ({ ...prev, gpuType: e.target.value }))}
                placeholder="例: A100, V100, RTX 4090"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCount">GPU数</Label>
              <Input
                id="totalCount"
                type="number"
                min="1"
                value={newServer.totalCount}
                onChange={(e) =>
                  setNewServer((prev) => ({ ...prev, totalCount: Number.parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">設置場所 *</Label>
              <Input
                id="location"
                value={newServer.location}
                onChange={(e) => setNewServer((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="例: データセンター1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory">メモリ</Label>
              <Input
                id="memory"
                value={newServer.memory}
                onChange={(e) => setNewServer((prev) => ({ ...prev, memory: e.target.value }))}
                placeholder="例: 40GB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="computeCapability">計算能力</Label>
              <Input
                id="computeCapability"
                value={newServer.computeCapability}
                onChange={(e) => setNewServer((prev) => ({ ...prev, computeCapability: e.target.value }))}
                placeholder="例: 8.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tensorCores">Tensor Cores</Label>
              <Input
                id="tensorCores"
                value={newServer.tensorCores}
                onChange={(e) => setNewServer((prev) => ({ ...prev, tensorCores: e.target.value }))}
                placeholder="例: 3rd gen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddServer}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* サーバー削除確認ダイアログ */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              サーバーの削除
            </DialogTitle>
            <DialogDescription>本当にこのサーバーを削除しますか？この操作は取り消せません。</DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <div className="py-4">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>サーバー名:</strong> {selectedServer.name}
                </div>
                <div>
                  <strong>GPUタイプ:</strong> {selectedServer.gpuType}
                </div>
                <div>
                  <strong>設置場所:</strong> {selectedServer.location}
                </div>
                <div>
                  <strong>GPU数:</strong> {selectedServer.totalCount}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleRemoveServer}>
              削除実行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
