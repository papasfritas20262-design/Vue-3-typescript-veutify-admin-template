<template>
  <v-container class="fill-height d-flex justify-center align-center login-background pa-4">
    <v-card
      class="pa-6 rounded-xl text-center fade-in"
      max-width="420"
      elevation="12"
    >
      <v-form @submit.prevent="handleSubmit" autocomplete="on">
        <v-card-title class="justify-center mb-6">
          <v-avatar color="primary" size="56" class="mb-3">
            <v-icon color="white">mdi-account</v-icon>
          </v-avatar>
        </v-card-title>

        <h2 class="text-h6 text-md-h5 font-weight-medium mb-6 text-primary">
          {{ isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta' }}
        </h2>

        <v-text-field
          v-if="!isLogin"
          v-model.trim="displayName"
          label="Nombre"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          :rules="[v => !!v || 'Requerido']"
        />

        <v-text-field
          v-model.trim="email"
          label="Correo electrónico"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          type="email"
          :rules="[v => !!v || 'El correo es requerido']"
        />

        <v-text-field
          v-model.trim="password"
          label="Contraseña"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          density="comfortable"
          :type="showPassword ? 'text' : 'password'"
          class="mb-2"
          :rules="[v => !!v || 'La contraseña es requerida']"
        />

        <v-text-field
          v-if="!isLogin"
          v-model.trim="confirmPassword"
          label="Confirmar contraseña"
          prepend-inner-icon="mdi-lock-check-outline"
          variant="outlined"
          density="comfortable"
          :type="showPassword ? 'text' : 'password'"
          class="mb-2"
          :rules="[v => v === password || 'Las contraseñas no coinciden']"
        />

        <div v-if="isLogin" class="text-right text-caption mb-4">
          <v-btn variant="text" size="small" color="primary" class="px-0">
            ¿Olvidaste tu contraseña?
          </v-btn>
        </div>

        <v-btn
          block
          color="primary"
          size="large"
          rounded="xl"
          type="submit"
          class="btn-responsive mt-2"
          :loading="loading"
        >
          {{ isLogin ? 'Iniciar sesión' : 'Registrarse' }}
        </v-btn>

        <v-alert
          v-if="authStore.error"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4 text-left"
          closable
          @click:close="authStore.error = null"
        >
          {{ authStore.error }}
        </v-alert>

        <div class="mt-6 text-body-2">
          {{ isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?' }}
          <v-btn variant="text" size="small" color="primary" @click="toggleMode" class="font-weight-bold">
            {{ isLogin ? 'Regístrate' : 'Inicia sesión' }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const loading = ref(false)
const isLogin = ref(true)
const showPassword = ref(false) // MEJORA: Control de visibilidad

const router = useRouter()
const authStore = useAuthStore()

const toggleMode = () => {
  isLogin.value = !isLogin.value
  authStore.error = null 
}

// MEJORA: Función centralizada de envío
const handleSubmit = async () => {
  if (!email.value || !password.value) return
  
  loading.value = true
  authStore.error = null
  
  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value)
    } else {
      if (password.value !== confirmPassword.value) {
        authStore.error = 'Las contraseñas no coinciden'
        return
      }
      await authStore.register(email.value, password.value, displayName.value)
    }
    router.push('/')
  } catch (error) {
    console.error("Login Error:", error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.btn-responsive {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

@media (max-width: 600px) {
  .btn-responsive {
    font-size: 0.9rem !important;
  }
  .v-card {
    padding: 1rem !important;
  }
}
</style>
