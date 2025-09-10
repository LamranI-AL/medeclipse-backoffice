'use server'

import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"

export async function logout() {
  try {
    await auth.api.signOut()
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: "Erreur lors de la déconnexion"
    }
  }
}

export async function logoutAndRedirect() {
  await logout()
  redirect('/login')
}