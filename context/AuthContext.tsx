import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi, getToken, setToken, type AuthUser, type Rol, ApiError } from '@/lib/api'

type AuthState = {
  usuario: AuthUser | null
  cargando: boolean
}

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>
  registrar: (email: string, password: string, nombre: string, rol: Rol) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_KEY = 'torneoapp_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<AuthUser | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    ;(async () => {
      const token = await getToken()
      if (token) {
        // Recuperamos el usuario guardado localmente (evita otro round-trip al backend)
        try {
          const guardado = await AsyncStorage.getItem(USER_KEY)
          if (guardado) setUsuario(JSON.parse(guardado))
        } catch {
          // Si falla, el usuario simplemente tendrá que loguearse de nuevo
        }
      }
      setCargando(false)
    })()
  }, [])

  async function persistirSesion(token: string, user: AuthUser) {
    await setToken(token)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    setUsuario(user)
  }

  async function login(email: string, password: string) {
    const { token, user } = await authApi.login(email, password)
    await persistirSesion(token, user)
  }

  async function registrar(email: string, password: string, nombre: string, rol: Rol) {
    const { token, user } = await authApi.register(email, password, nombre, rol)
    await persistirSesion(token, user)
  }

  async function logout() {
    await setToken(null)
    await AsyncStorage.removeItem(USER_KEY)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export { ApiError }
