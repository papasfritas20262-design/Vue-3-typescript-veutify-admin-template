import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import vuetify from '@/plugins/vuetify'
import { useAuthStore } from '@/stores/useAuthStore'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const authStore = useAuthStore()
authStore.initAuth() // inicializa escucha de autenticación

app.use(router)
app.use(vuetify)
app.mount('#app')
