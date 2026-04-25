<template>
  <v-app>
    <!-- SIDEBAR -->
    <v-navigation-drawer
      v-model="drawer"
      :temporary="mobile"
      :permanent="!mobile"
      elevation="3"
      class="bg-white"
    >
      <!-- LOGO / BRAND -->
      <v-list-item class="px-4 py-4">
        <template #prepend>
          <v-avatar image="/vite.svg" />
        </template>

        <v-list-item-title class="text-h6 font-weight-bold">
          FullMarket Admin
        </v-list-item-title>
 
      </v-list-item>

      <v-divider />

      <!-- MENU -->
      <v-list nav density="comfortable">
       

        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          rounded="lg"
          active-class="bg-primary text-white"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>

          <!-- Badges opcionales -->
          <template #append v-if="item.badge">
            <v-chip
              size="x-small"
              color="primary"
              variant="flat"
            >
              {{ typeof item.badge === 'function' ? item.badge() : item.badge }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <template #append>
        <v-divider />
        <div class="pa-4 text-center text-caption text-medium-emphasis">
          OrderFlow v1.0.0
        </div>
      </template>
    </v-navigation-drawer>

    <!-- TOP BAR -->
    <v-app-bar elevation="1" color="white">
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title class="font-weight-bold text-primary">
        {{ currentTitle }}
      </v-toolbar-title>

      <v-spacer />


      <!-- FECHA -->
      <v-chip
        class="mr-3 d-none d-md-flex"
        variant="outlined"
        color="primary"
      >
        <v-icon start>mdi-calendar</v-icon>
        {{ currentDate }}
      </v-chip>

      <!-- NOTIFICACIONES -->
      <v-menu v-model="notificationsOpen" location="bottom end" width="360">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-badge
              color="error"
              :content="newOrdersCount"
              :model-value="newOrdersCount > 0"
              overlap
            >
              <v-icon>mdi-bell-outline</v-icon>
            </v-badge>
          </v-btn>
        </template>

        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Notificaciones
          </v-card-title>
          <v-divider />

          <v-list v-if="recentNotifications.length" density="compact">
            <v-list-item
              v-for="item in recentNotifications"
              :key="item.order.id"
              :to="'/pedidos'"
              class="py-2"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon size="18">mdi-receipt-text</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="text-body-2 font-weight-medium">
                Pedido #{{ formatId(item.order.id) }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ item.order.cliente.nombre }} {{ item.order.cliente.apellido }} • {{ formatDate(item.order.fecha) }}
              </v-list-item-subtitle>

              <template #append>
                <div class="text-right">
                  <v-chip
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    class="mb-1 font-weight-medium"
                  >
                    {{ item.order.estado }}
                  </v-chip>
                  <v-chip
                    v-if="item.unread"
                    size="x-small"
                    color="error"
                    variant="flat"
                    class="mb-1 ml-1 font-weight-medium"
                  >
                    Nuevo
                  </v-chip>
                  <div class="text-caption text-grey-darken-2">
                    {{ formatCurrency(item.order.resumen.total) }}
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <div v-else class="pa-4 text-center text-caption text-grey">
            No hay notificaciones nuevas.
          </div>

          <v-divider />
          <v-card-actions class="justify-end">
            <v-btn variant="text" to="/pedidos">Ver pedidos</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

      <!-- USUARIO -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-avatar color="primary" variant="tonal">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>

        <v-list width="220">
          <v-list-item>
            <v-list-item-title class="font-weight-medium">
              Antonio Hurtado
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Administrador
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider />

          <v-list-item prepend-icon="mdi-logout" @click="logout">
            <v-list-item-title class="text-error">
              Cerrar sesión
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- MAIN -->
    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOrderStore } from '@/stores/useOrderStore'

interface MenuItem {
  title: string
  icon: string
  to: string
  badge?: number | (() => number) | ComputedRef<number>
}

const authStore = useAuthStore()
const orderStore = useOrderStore()
const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()

const drawer = ref(!mobile.value)
const notificationsOpen = ref(false)
const seenOrderIds = ref<Set<string>>(new Set())

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})

const loadSeenOrderIds = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem('seenOrderIds')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      seenOrderIds.value = new Set(parsed.filter((id) => typeof id === 'string'))
    }
  } catch {
    // ignore malformed storage
  }
}

const persistSeenOrderIds = () => {
  if (typeof window === 'undefined') return
  const arr = Array.from(seenOrderIds.value).slice(-200)
  window.localStorage.setItem('seenOrderIds', JSON.stringify(arr))
}

const markAllRecibidoAsSeen = () => {
  let changed = false
  for (const order of orderStore.orders) {
    if (order.estado === 'Recibido' && !seenOrderIds.value.has(order.id)) {
      seenOrderIds.value.add(order.id)
      changed = true
    }
  }
  if (changed) persistSeenOrderIds()
}

const recentNotifications = computed(() => {
  return [...orderStore.orders]
    .filter(order => order.estado === 'Recibido')
    .sort((a, b) => getDateValue(b.fecha) - getDateValue(a.fecha))
    .slice(0, 6)
    .map((order) => ({
      order,
      unread: !seenOrderIds.value.has(order.id)
    }))
})

const newOrdersCount = computed(() => {
  return recentNotifications.value.filter((n) => n.unread).length
})

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'Pedidos', icon: 'mdi-receipt-text', to: '/pedidos', badge: newOrdersCount },
  { title: 'Clientes', icon: 'mdi-account-multiple', to: '/clientes' },
  { title: 'Productos', icon: 'mdi-cupcake', to: '/productos' },
  { title: 'Categorías', icon: 'mdi-tag-multiple', to: '/categorias' },
  // { title: 'Despachos', icon: 'mdi-truck-delivery', to: '/shipments' },
  // { title: 'Reportes', icon: 'mdi-chart-line', to: '/reports' },
]

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  orderStore.fetchOrders()
  loadSeenOrderIds()
})

watch(notificationsOpen, (open) => {
  if (open) markAllRecibidoAsSeen()
})

const currentTitle = computed(() => {
  return menuItems.find(i => i.to === route.path)?.title || 'FullMarket'
})

const currentDate = computed(() =>
  new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
)

const formatId = (id: string) => id ? id.slice(-6).toUpperCase() : '---'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)
}

const toDate = (timestamp: any): Date | null => {
  try {
    if (!timestamp) return null
    if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate()
    if (timestamp instanceof Date) return timestamp
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000)
    const d = new Date(timestamp)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

const getDateValue = (timestamp: any) => {
  const d = toDate(timestamp)
  return d ? d.getTime() : 0
}

const formatDate = (timestamp: any) => {
  const d = toDate(timestamp)
  if (!d) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d)
}
</script>
