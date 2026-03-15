import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'example-key'

let supabase = null
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} catch (err) {
  console.warn('⚠️  Supabase init warning (non-critical):', err.message)
  supabase = null
}

export { supabase }
// Auth helper functions
export async function signUpUser(email, password, name) {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) throw new Error(authError.message)

    // Insert user profile into public 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (userError) throw new Error(userError.message)

    return {
      id: authData.user.id,
      email,
      name,
      confirmation_sent: true
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function signInUser(email, password) {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw new Error(authError.message)

    // Get user profile from 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError) throw new Error('User profile not found')

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      verified: true
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return data || []
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function requestPasswordReset(email) {
  try {
    // Check if user exists in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      throw new Error('Email address not found. Try signing up instead.')
    }

    // Send password reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    })

    if (resetError) throw new Error(resetError.message)

    return { success: true, message: 'Password reset email sent' }
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function resetPasswordWithToken(token, newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) throw new Error(error.message)

    return { success: true, message: 'Password reset successfully' }
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/'
      }
    })

    if (error) throw new Error(error.message)

    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function signUpWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/'
      }
    })

    if (error) throw new Error(error.message)

    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function handleGoogleCallback() {
  try {
    // Get session from URL hash
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) throw new Error('Failed to get session')

    const user = session.user

    // Check if user profile exists
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // If user profile doesn't exist, create one
    if (!userData) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            created_at: new Date().toISOString(),
            auth_provider: 'google'
          }
        ])

      if (insertError) throw new Error(insertError.message)
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      verified: true,
      auth_provider: 'google'
    }
  } catch (error) {
    throw new Error(error.message)
  }
}
