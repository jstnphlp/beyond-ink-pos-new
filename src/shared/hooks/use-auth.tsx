import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabase'

export type UserRole = 'owner' | 'staff'
export type UserDepartment = 'physical_dept' | 'design_dept' | 'dev_dept' | null

interface AuthState {
  session: Session | null
  user: User | null
  role: UserRole | null
  department: UserDepartment
  displayName: string | null
  loading: boolean
  isAllowed: boolean
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchUserRole(): Promise<UserRole | null> {
  const { data, error } = await supabase.rpc('get_user_role')
  if (error || !data) return null
  return data as UserRole
}

async function fetchUserDepartment(): Promise<UserDepartment> {
  const { data, error } = await supabase.rpc('get_user_department')
  if (error || !data) return null
  return data as UserDepartment
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [department, setDepartment] = useState<UserDepartment>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const resolveUser = useCallback(async (sess: Session | null) => {
    if (!sess?.user?.email) {
      setRole(null)
      setDepartment(null)
      setDisplayName(null)
      setLoading(false)
      return
    }

    const userRole = await fetchUserRole()
    if (userRole) {
      setRole(userRole)
      setDisplayName(sess.user.user_metadata?.full_name || sess.user.email)
      const dept = await fetchUserDepartment()
      setDepartment(dept)
    } else {
      setRole(null)
      setDepartment(null)
      setDisplayName(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial)
      resolveUser(initial)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess)
        setLoading(true)
        resolveUser(sess)
      }
    )

    return () => subscription.unsubscribe()
  }, [resolveUser])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setRole(null)
    setDepartment(null)
    setDisplayName(null)
  }, [])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    role,
    department,
    displayName,
    loading,
    isAllowed: role !== null,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
