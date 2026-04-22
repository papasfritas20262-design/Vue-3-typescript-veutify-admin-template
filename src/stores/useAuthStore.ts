import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

import { auth } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // --- Crear cuenta (registro) ---
  const register = async (email: string, password: string, displayName: string) => {
    error.value = null
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(newUser, { displayName })
      user.value = newUser
    } catch (err: any) {
      console.error('Error al registrar usuario:', err)
      error.value = getFriendlyFirebaseError(err.code)
      throw err
    }
  }

  // --- Iniciar sesión con email/contraseña ---
  const login = async (email: string, password: string) => {
    error.value = null
    try {
      const { user: userCredential } = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err)
      error.value = getFriendlyFirebaseError(err.code)
      throw err
    }
  }

  // --- Iniciar sesión con Google ---
  const loginWithGoogle = async () => {
    error.value = null
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      user.value = result.user
    } catch (err: any) {
      console.error('Error al iniciar con Google:', err)
      error.value = 'Error al iniciar sesión con Google.'
      throw err
    }
  }

  // --- Cerrar sesión ---
  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err)
      error.value = 'No se pudo cerrar sesión correctamente.'
    }
  }

  // --- Inicializar autenticación ---
  const initAuth = () => {
    onAuthStateChanged(auth, (u) => {
      user.value = u
      loading.value = false
    })
  }

  // --- Traducción de errores de Firebase ---
  const getFriendlyFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo ya está registrado.'
      case 'auth/invalid-email':
        return 'El formato del correo no es válido.'
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil (mínimo 6 caracteres).'
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.'
      case 'auth/user-not-found':
        return 'No existe una cuenta con ese correo.'
      default:
        return 'Ocurrió un error inesperado.'
    }
  }

  return {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    initAuth
  }
})
