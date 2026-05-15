import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Enums } from '@/integrations/supabase/types'

type AppRole = Enums<'app_role'>  // 'student' | 'counselor' | 'admin' | 'parent'

export interface RegistrationFormData {
  // Basic info
  full_name: string
  email: string
  password: string
  confirm_password: string
  role: AppRole

  // School info (students only)
  school_name?: string
  grade?: string
  graduation_year?: string

  // Parent details (students only)
  parent_name?: string
  parent_email?: string
  parent_phone?: string
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = async (formData: RegistrationFormData) => {
    setLoading(true)
    setError(null)

    try {
      // ── Step 1: Create auth user ──────────────────────────────
      // Supabase issues a JWT automatically on signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const userId = authData.user.id

      // ── Step 2: Handle school (students only) ─────────────────
      // If student provided a school name, find or create it in schools table
      let schoolId: string | null = null
      if (formData.role === 'student' && formData.school_name?.trim()) {
        // Check if school already exists
        const { data: existingSchool } = await supabase
          .from('schools')
          .select('id')
          .ilike('name', formData.school_name.trim())
          .single()

        if (existingSchool) {
          schoolId = existingSchool.id
        } else {
          // Create new school
          const { data: newSchool, error: schoolError } = await supabase
            .from('schools')
            .insert({ name: formData.school_name.trim() })
            .select('id')
            .single()

          if (schoolError) throw schoolError
          schoolId = newSchool.id
        }
      }

      // ── Step 3: Insert into profiles ──────────────────────────
      // profiles has: user_id, email, full_name, avatar_url, school_id
      // NOTE: no role here — role lives in user_roles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: formData.email,
          full_name: formData.full_name,
          school_id: schoolId,
        })

      if (profileError) throw profileError

      // ── Step 4: Insert into user_roles ────────────────────────
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: formData.role,
        })

      if (roleError) throw roleError

      // ── Step 5: Insert into student_profiles (students only) ──
      if (formData.role === 'student') {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: userId,
            grade: formData.grade || null,
            graduation_year: formData.graduation_year
              ? parseInt(formData.graduation_year)
              : null,
            parent_name: formData.parent_name || null,
            parent_email: formData.parent_email || null,
            parent_phone: formData.parent_phone || null,
          })

        if (studentError) throw studentError
      }

      // ── Step 6: Send welcome email (non-fatal) ────────────────
      supabase.functions.invoke('send-welcome-email', {
        body: {
          email: formData.email,
          fullName: formData.full_name,
          role: formData.role,
          appUrl: window.location.origin,
        },
      }).catch((err) => console.error('Welcome email failed:', err))

      return { user: authData.user, session: authData.session }

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError

      return data

    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Fetch role from user_roles table (source of truth)
  const getUserRole = async (): Promise<AppRole | null> => {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (error || !data) return null
    return data.role
  }

  // Fetch full profile from profiles table
  const getUserProfile = async () => {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*, schools(name)')
      .eq('user_id', user.id)
      .single()

    if (error) return null
    return data
  }

  return {
    register,
    login,
    logout,
    getCurrentUser,
    getUserRole,
    getUserProfile,
    loading,
    error,
  }
}