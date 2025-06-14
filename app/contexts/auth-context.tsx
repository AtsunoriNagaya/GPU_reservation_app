"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  department: string
  role: "user" | "admin"
  priorityLevel: "high" | "medium" | "low"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// サンプルユーザーデータ
const sampleUsers: User[] = [
  {
    id: "user-001",
    name: "田中太郎",
    email: "tanaka@example.com",
    department: "機械学習研究室",
    role: "user",
    priorityLevel: "medium",
  },
  {
    id: "user-002",
    name: "佐藤花子",
    email: "sato@example.com",
    department: "コンピュータビジョン研究室",
    role: "user",
    priorityLevel: "high",
  },
  {
    id: "admin-001",
    name: "管理者",
    email: "admin@example.com",
    department: "システム管理",
    role: "admin",
    priorityLevel: "high",
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ローカルストレージから認証情報を復元
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // 実際の実装では認証APIを呼び出し
    const foundUser = sampleUsers.find((u) => u.email === email)
    if (foundUser && password === "password") {
      setUser(foundUser)
      localStorage.setItem("currentUser", JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
