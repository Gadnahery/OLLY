import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ADMIN_PERMS = {
  sales: true, purchases: true, production: true, inventory: true,
  orders: true, customers: true, suppliers: true, finance: true,
  payroll: true, reports: true, settings: true, staff: true,
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStaff = useCallback(async (authUser) => {
    if (!authUser) {
      setStaff(null)
      return
    }
    // Link invite by email if needed
    await supabase.from('staff_members')
      .update({ user_id: authUser.id, updated_at: new Date().toISOString() })
      .eq('email', authUser.email)
      .is('user_id', null)

    let { data } = await supabase
      .from('staff_members')
      .select('*')
      .or(`user_id.eq.${authUser.id},email.eq.${authUser.email}`)
      .maybeSingle()

    if (!data) {
      // First login → create as admin
      const { data: created } = await supabase.from('staff_members').insert({
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: 'admin',
        permissions: ADMIN_PERMS,
      }).select().single()
      data = created
    }
    setStaff(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      await loadStaff(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      await loadStaff(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [loadStaff])

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setStaff(null)
  }

  function can(module) {
    if (!staff) return false
    if (staff.role === 'admin') return true
    return !!staff.permissions?.[module]
  }

  const isAdmin = staff?.role === 'admin'

  return (
    <AuthContext.Provider value={{ session, user, staff, loading, signUp, signIn, signOut, can, isAdmin, reloadStaff: () => loadStaff(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
