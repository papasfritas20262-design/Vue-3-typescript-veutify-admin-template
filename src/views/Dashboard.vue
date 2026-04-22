<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6" align="center">
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-bold">{{ title }}</h1>
        <p class="text-subtitle-2 text-grey-darken-1">{{ subtitle }}</p>
      </v-col>
      <v-col cols="12" md="4" class="text-md-right">
        <v-chip color="primary" variant="tonal" class="font-weight-medium">
          Actualizado: {{ lastUpdatedLabel }}
        </v-chip>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="(item, index) in stats" :key="index" cols="12" sm="6" lg="3">
        <v-card variant="flat" class="border pa-4">
          <v-list-item class="px-0">
            <template v-slot:prepend v-if="item.icon">
              <v-icon :color="item.color" size="large" :icon="item.icon" class="mr-4"></v-icon>
            </template>

            <v-list-item-title class="text-overline mb-1">
              {{ item.label }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-h5 font-weight-bold text-high-emphasis">
              {{ item.value }}
            </v-list-item-subtitle>
          </v-list-item>

          <div class="mt-2 text-caption text-medium-emphasis">
            {{ item.helper }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12" md="7">
        <v-card variant="flat" class="border">
          <v-card-title class="px-4 pt-4">Pedidos recientes</v-card-title>
          <v-divider class="mb-2"></v-divider>

          <v-list v-if="recentOrders.length" density="compact">
            <v-list-item v-for="order in recentOrders" :key="order.id">
              <template #prepend>
                <v-avatar color="primary" variant="tonal" class="mr-3">
                  <span class="text-caption font-weight-bold">{{ orderInitial(order) }}</span>
                </v-avatar>
              </template>

              <v-list-item-title class="text-body-2 font-weight-medium">
                #{{ formatId(order.id) }} · {{ order.cliente.nombre }} {{ order.cliente.apellido }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ formatDate(order.fecha) }}
              </v-list-item-subtitle>

              <template #append>
                <div class="text-right">
                  <v-chip
                    :color="STATUS_CONFIG[order.estado]?.color"
                    size="x-small"
                    variant="flat"
                    class="text-uppercase font-weight-bold mb-1"
                  >
                    {{ order.estado }}
                  </v-chip>
                  <div class="text-caption text-grey-darken-2">
                    {{ formatCurrency(order.resumen.total) }}
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <div v-else class="pa-6 text-center text-grey">
            No hay pedidos recientes.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card variant="flat" class="border">
          <v-card-title class="px-4 pt-4">Alertas de stock</v-card-title>
          <v-divider class="mb-2"></v-divider>

          <v-list v-if="lowStockProducts.length" density="compact">
            <v-list-item v-for="item in lowStockProducts" :key="item.id">
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ item.name }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                Categoría: {{ item.categoryName || '—' }}
              </v-list-item-subtitle>
              <template #append>
                <v-chip
                  :color="item.stock <= 0 ? 'error' : 'warning'"
                  size="x-small"
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ item.stock }} en stock
                </v-chip>
              </template>
            </v-list-item>
          </v-list>

          <div v-else class="pa-6 text-center text-grey">
            No hay alertas de stock.
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useOrderStore } from '@/stores/useOrderStore'
import { useProductStore } from '@/stores/useProduct'
import type { Category } from '@/types/product'
import type { Order } from '@/types/order'

interface StatItem {
  label: string
  value: string | number
  icon?: string
  color?: string
  helper: string
}

const title = 'Dashboard'
const subtitle = 'Resumen operativo del día'

const orderStore = useOrderStore()
const productStore = useProductStore()

const lastUpdatedLabel = ref('—')

const STATUSES = {
  RECIBIDO: 'Recibido',
  PREPARANDO: 'Preparando',
  EN_CAMINO: 'En Camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado'
} as const

const STATUS_CONFIG: Record<string, { color: string }> = {
  [STATUSES.RECIBIDO]:   { color: 'blue' },
  [STATUSES.PREPARANDO]: { color: 'orange' },
  [STATUSES.EN_CAMINO]:  { color: 'deep-purple' },
  [STATUSES.ENTREGADO]:  { color: 'success' },
  [STATUSES.CANCELADO]:  { color: 'grey' }
}

const orders = computed(() => orderStore.orders || [])
const products = computed(() => productStore.products || [])
const categories = computed<Category[]>(() => productStore.categories || [])

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

const isSameDay = (a: Date | null, b: Date) => {
  if (!a) return false
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const getDateValue = (timestamp: any) => {
  const d = toDate(timestamp)
  return d ? d.getTime() : 0
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)
}

const formatId = (id: string) => id ? id.slice(-6).toUpperCase() : '---'

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

const today = computed(() => new Date())

const ordersToday = computed(() =>
  orders.value.filter((o: Order) => isSameDay(toDate(o.fecha), today.value))
)

const pendingOrders = computed(() =>
  orders.value.filter((o: Order) =>
    o.estado === STATUSES.RECIBIDO || o.estado === STATUSES.PREPARANDO
  )
)

const enRutaOrders = computed(() =>
  orders.value.filter((o: Order) => o.estado === STATUSES.EN_CAMINO)
)

const deliveredToday = computed(() =>
  ordersToday.value.filter((o: Order) => o.estado === STATUSES.ENTREGADO)
)

const revenueToday = computed(() =>
  ordersToday.value
    .filter((o: Order) => o.estado !== STATUSES.CANCELADO)
    .reduce((sum, o) => sum + (o.resumen?.total || 0), 0)
)

const stats = computed<StatItem[]>(() => [
  {
    label: 'Pedidos hoy',
    value: ordersToday.value.length,
    icon: 'mdi-cart',
    color: 'primary',
    helper: `${deliveredToday.value.length} entregados hoy`
  },
  {
    label: 'Pendientes',
    value: pendingOrders.value.length,
    icon: 'mdi-timer-sand',
    color: 'orange',
    helper: 'Recibidos + preparando'
  },
  {
    label: 'En ruta',
    value: enRutaOrders.value.length,
    icon: 'mdi-moped',
    color: 'deep-purple',
    helper: 'Pedidos en camino'
  },
  {
    label: 'Ingresos hoy',
    value: formatCurrency(revenueToday.value),
    icon: 'mdi-cash-multiple',
    color: 'success',
    helper: 'Sin cancelados'
  }
])

const recentOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => getDateValue(b.fecha) - getDateValue(a.fecha))
    .slice(0, 6)
)

const categoryName = (categoryId?: string) => {
  if (!categoryId) return ''
  const cat = categories.value.find((c) => c.id === categoryId)
  return cat?.name || ''
}

const lowStockProducts = computed(() =>
  products.value
    .map((p) => ({
      id: p.id,
      name: p.data.name,
      stock: p.data.stock ?? 0,
      categoryName: categoryName(p.data.category)
    }))
    .filter((p) => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)
)

const orderInitial = (order: Order) => {
  const name = order?.cliente?.nombre || ''
  return name ? name.charAt(0).toUpperCase() : '#'
}

onMounted(async () => {
  orderStore.fetchOrders()
  productStore.listenProducts()
  await productStore.fetchCategories()
  lastUpdatedLabel.value = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date())
})

onUnmounted(() => {
  productStore.stopListeningProducts()
})
</script>

<style scoped>
</style>
