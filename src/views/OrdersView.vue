<template>
  <v-container fluid class="pa-2 pa-md-4 bg-grey-lighten-4 h-100">
    <v-row  class="mb-4">
      <v-col cols="12" md="6">
        <h1 class="text-h5 text-md-h4 font-weight-black text-grey-darken-3">
          Panel de Despacho
        </h1>
        <div class="d-flex align-center text-grey-darken-1">
          <v-icon size="small" class="me-1">mdi-store-clock-outline</v-icon>
          <span class="text-body-2">Gestion operativa en tiempo real</span>
        </div>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card flat class="bg-white pa-1 rounded-lg border">
          <v-row dense >
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="search"
                placeholder="Buscar por cliente, ID o teléfono..."
                prepend-inner-icon="mdi-magnify"
                variant="plain"
                density="compact"
                hide-details
                single-line
                bg-color="transparent"
                class="ps-2"
              />
            </v-col>
            <v-divider vertical class="my-2 d-none d-sm-flex" />
            <v-col cols="12" sm="6" class="d-flex align-center">
              <div class="text-caption text-grey-darken-1 me-2">Estado:</div>
              <v-btn-toggle
                v-model="selectedStatuses"
                multiple
                density="compact"
                variant="outlined"
                class="flex-wrap"
              >
                <v-btn
                  value="__ALL__"
                  class="text-none"
                  @click.stop="clearStatusFilter"
                >
                  Todos
                </v-btn>
                <v-btn
                  v-for="status in STATUS_OPTIONS"
                  :key="status"
                  :value="status"
                  class="text-none"
                >
                  {{ status }}
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="orderStore.loading">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="article, actions" elevation="2" class="rounded-lg"/>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col 
        v-for="order in filteredOrders" 
        :key="order.id" 
        cols="12" sm="6" md="4" lg="3"
      >
        <v-card 
          class="order-card d-flex flex-column h-100" 
          elevation="2"
          rounded="lg"
          @click="openDetails(order)"
        >
          <div class="pa-3 bg-grey-lighten-5 border-bottom">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption font-weight-black text-grey-darken-3 font-mono">
                #{{ formatId(order.id) }}
              </span>
              <v-chip 
                :color="STATUS_CONFIG[order.estado]?.color" 
                size="x-small" 
                variant="flat"
                class="text-uppercase font-weight-bold"
              >
                {{ order.estado }}
              </v-chip>
            </div>
            <div class="d-flex align-center text-caption text-grey-darken-1">
              <v-icon size="14" class="me-1">mdi-calendar-clock</v-icon>
              {{ formatDate(order.fecha) }}
            </div>
          </div>

          <v-card-text class="pa-3 flex-grow-1">
            <div class="mb-3">
              <div class="text-subtitle-1 font-weight-bold lh-1 text-truncate text-primary">
                {{ order.cliente.nombre }} {{ order.cliente.apellido }}
              </div>
              
              <div class="d-flex align-center gap-2 mt-2">
                <v-btn
                  :href="`tel:${order.cliente.telefono}`"
                  icon="mdi-phone"
                  size="x-small"
                  variant="tonal"
                  color="success"
                  density="comfortable"
                  @click.stop
                  v-tooltip:top="'Llamar'"
                />
                <v-btn
                  :href="`mailto:${order.cliente.correo}`"
                  icon="mdi-email-outline"
                  size="x-small"
                  variant="tonal"
                  color="info"
                  density="comfortable"
                  @click.stop
                  v-tooltip:top="'Enviar correo'"
                />
                <span class="text-caption text-grey-darken-2 ms-1">{{ order.cliente.telefono }}</span>
              </div>
            </div>

            <v-divider class="mb-3 border-dashed" />

            <div class="mb-3">
              <div class="d-flex align-center mb-1">
                <v-icon 
                  :icon="order.metodoEntrega === 'recogida' ? 'mdi-store-marker' : 'mdi-moped'" 
                  size="18" 
                  :color="order.metodoEntrega === 'recogida' ? 'orange-darken-2' : 'blue-darken-2'"
                  class="me-2"
                />
                <span class="text-caption font-weight-bold text-uppercase">
                  {{ order.metodoEntrega === 'recogida' ? 'Recoge en Tienda' : 'Domicilio' }}
                </span>
              </div>
              <div class="text-caption text-grey-darken-2 ps-7 lh-1" style="min-height: 2.5em;">
                {{ order.cliente.direccion }}
              </div>
            </div>

            <div class="bg-grey-lighten-4 rounded pa-2 mt-auto">
              <div v-for="(p, i) in order.productos.slice(0, 3)" :key="i" class="d-flex justify-space-between text-caption mb-1">
                <span class="text-truncate" style="max-width: 75%">
                  <span class="font-weight-black">{{ p.cantidad }}x</span> {{ p.nombre }}
                </span>
                <span class="font-weight-medium">{{ formatCurrency(p.subtotal) }}</span>
              </div>
              <div v-if="order.productos.length > 3" class="text-center text-caption text-primary font-weight-bold mt-1 cursor-pointer">
                Ver {{ order.productos.length - 3 }} más...
              </div>
            </div>
          </v-card-text>

          <v-divider />

          <div class="pa-3 bg-white">
            <div class="d-flex justify-space-between align-center mb-3">
              <div>
                <span class="text-caption text-grey">Total a pagar</span>
                <div class="text-h6 font-weight-black text-grey-darken-3 lh-1">
                  {{ formatCurrency(order.resumen.total) }}
                </div>
              </div>
              
              <v-chip 
                v-if="order.resumen.envio > 0" 
                size="x-small" 
                color="blue-grey" 
                variant="outlined"
              >
                Envío: {{ formatCurrency(order.resumen.envio) }}
              </v-chip>
            </div>

            <v-btn
              v-if="getNextStatus(order.estado)"
              block
              :color="STATUS_CONFIG[getNextStatus(order.estado) || '']?.color"
              variant="flat"
              :loading="updatingId === order.id"
              class="text-none font-weight-bold letter-spacing-normal"
              @click.stop="advanceOrder(order)"
            >
              {{ getNextActionLabel(order.estado) }}
              <v-icon end size="small">mdi-arrow-right</v-icon>
            </v-btn>

            <v-btn 
              v-else 
              block 
              variant="tonal" 
              color="grey" 
              class="text-none"
              disabled
            >
              <v-icon start size="small">mdi-check-circle</v-icon>
              Pedido Finalizado
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col v-if="filteredOrders.length === 0" cols="12" class="text-center mt-10">
        <v-icon size="64" color="grey-lighten-2" class="mb-2">mdi-clipboard-text-search-outline</v-icon>
        <h3 class="text-subtitle-1 text-grey-darken-1">{{ emptyStateMessage }}</h3>
        <v-btn 
          v-if="selectedStatuses.length > 0" 
          variant="text" 
          color="primary" 
          class="mt-2 text-none"
          @click="clearStatusFilter"
        >
          Limpiar filtros
        </v-btn>
      </v-col>
    </v-row>

    <v-dialog v-model="detailsDialog" max-width="600" scrollable>
      <v-card v-if="selectedOrder" rounded="lg">
        <v-toolbar color="white" density="compact" class="border-bottom pr-2">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            Pedido #{{ formatId(selectedOrder.id) }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="detailsDialog = false"></v-btn>
        </v-toolbar>

        <v-card-text class="bg-grey-lighten-5 pa-4">
          <v-card flat class="mb-4">
            <v-card-text>
              <div class="d-flex align-center gap-3 mb-3">
                <v-avatar color="primary" variant="tonal">
                  <span class="text-h6">{{ selectedOrder.cliente.nombre.charAt(0) }}</span>
                </v-avatar>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">{{ selectedOrder.cliente.nombre }} {{ selectedOrder.cliente.apellido }}</div>
                  <div class="text-caption text-grey">{{ selectedOrder.cliente.correo }}</div>
                </div>
              </div>
              <v-divider class="mb-3"/>
              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-grey">Teléfono</div>
                  <div class="text-body-2">{{ selectedOrder.cliente.telefono }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Método</div>
                  <div class="text-body-2 text-capitalize">{{ selectedOrder.metodoEntrega }}</div>
                </v-col>
                <v-col cols="12" class="mt-2">
                   <div class="text-caption text-grey">Dirección</div>
                   <div class="text-body-2">{{ selectedOrder.cliente.direccion }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <div class="text-subtitle-2 font-weight-bold mb-2 ml-1">Detalle de Productos</div>
          <v-card flat>
            <div 
              v-for="(prod, i) in selectedOrder.productos" 
              :key="i" 
              class="d-flex justify-space-between align-center pa-3 border-bottom-light"
            >
              <div class="d-flex align-center gap-3">
                <v-sheet color="grey-lighten-3" width="40" height="40" rounded class="d-flex align-center justify-center font-weight-bold text-caption">
                  x{{ prod.cantidad }}
                </v-sheet>
                <div>
                  <div class="text-body-2 font-weight-medium">{{ prod.nombre }}</div>
                  <div class="text-caption text-grey">Unitario: {{ formatCurrency(prod.precioUnitario) }}</div>
                </div>
              </div>
              <div class="text-body-2 font-weight-bold">
                {{ formatCurrency(prod.subtotal) }}
              </div>
            </div>
            
            <div class="bg-grey-lighten-4 pa-4">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>Subtotal</span>
                <span>{{ formatCurrency(selectedOrder.resumen.subtotal) }}</span>
              </div>
              <div class="d-flex justify-space-between text-caption mb-2">
                <span>EnvÃ­o</span>
                <span>{{ formatCurrency(selectedOrder.resumen.envio) }}</span>
              </div>
              <v-divider class="mb-2"/>
              <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold">
                <span>Total</span>
                <span class="text-success">{{ formatCurrency(selectedOrder.resumen.total) }}</span>
              </div>
            </div>
          </v-card>
        </v-card-text>

        <v-card-actions class="pa-3 bg-white border-top">
          <v-btn 
            color="error" 
            variant="text" 
            prepend-icon="mdi-cancel"
            @click="cancelOrder(selectedOrder)"
          >
            Cancelar Pedido
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            variant="elevated" 
            color="primary" 
            @click="detailsDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '@/stores/useOrderStore'

// --- 0. TIPOS ---
interface Cliente {
  nombre: string
  apellido: string
  telefono: string
  correo: string
  direccion: string
}

interface Producto {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface Resumen {
  subtotal: number
  envio: number
  total: number
}

interface Order {
  id: string
  estado: string
  fecha: any
  cliente: Cliente
  metodoEntrega: string
  productos: Producto[]
  resumen: Resumen
}

// --- 1. CONFIGURACIÓN Y CONSTANTES ---
const STATUSES = {
  RECIBIDO: 'Recibido',
  PREPARANDO: 'Preparando',
  EN_CAMINO: 'En Camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado'
} as const

const STATUS_CONFIG: Record<string, { color: string, next?: string }> = {
  [STATUSES.RECIBIDO]:   { color: 'blue',        next: STATUSES.PREPARANDO },
  [STATUSES.PREPARANDO]: { color: 'orange',      next: STATUSES.EN_CAMINO },
  [STATUSES.EN_CAMINO]:  { color: 'deep-purple', next: STATUSES.ENTREGADO },
  [STATUSES.ENTREGADO]:  { color: 'success',     next: undefined },
  [STATUSES.CANCELADO]:  { color: 'grey',        next: undefined }
}

const STATUS_OPTIONS = Object.values(STATUSES)

// --- 2. ESTADO Y STORE ---
const orderStore = useOrderStore()

const search = ref('')
const selectedStatuses = ref<string[]>([]) // vacío = todos
const updatingId = ref<string | null>(null)
const detailsDialog = ref(false)
const selectedOrder = ref<Order | null>(null)

// --- 3. CICLO DE VIDA ---
onMounted(() => {
  orderStore.fetchOrders()
})

// --- 4. COMPUTED PROPERTIES ---
const filteredOrders = computed(() => {
  const term = search.value.toLowerCase().trim()
  const statusFilter = selectedStatuses.value
  
  return orderStore.orders.filter((o: Order) => {
    // 1. Filtro de Estado
    if (statusFilter.length > 0 && !statusFilter.includes(o.estado)) return false
    
    // 2. Filtro de Texto (Busca en nombre, apellido, ID o teléfono)
    if (!term) return true
    
    const fullName = `${o.cliente.nombre} ${o.cliente.apellido}`.toLowerCase()
    const id = o.id.toString().toLowerCase()
    const phone = o.cliente.telefono.toString()
    
    return fullName.includes(term) || id.includes(term) || phone.includes(term)
  })
})

const emptyStateMessage = computed(() => {
  if (selectedStatuses.value.length > 0 || search.value.trim()) {
    return 'No hay pedidos que coincidan con los filtros actuales'
  }
  return 'No hay pedidos disponibles'
})

// --- 5. HELPERS DE FORMATO ---
const getNextStatus = (currentStatus: string) => STATUS_CONFIG[currentStatus]?.next

const getNextActionLabel = (currentStatus: string) => {
  const labels: Record<string, string> = {
    'Recibido': 'Iniciar Preparación',
    'Preparando': 'Despachar a Ruta',
    'En Camino': 'Confirmar Entrega'
  }
  return labels[currentStatus] || 'Avanzar Estado'
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
  try {
    if (!timestamp) return 'Sin fecha';

    let date: Date;

    // 1. Si es un Timestamp de Firebase (tiene el método toDate)
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // 2. Si ya es un objeto Date
    else if (timestamp instanceof Date) {
      date = timestamp;
    } 
    // 3. Si viene como segundos/nanosegundos (objeto comÃºn de Firestore)
    else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    // 4. Intento final: parsear como string o nÃºmero
    else {
      date = new Date(timestamp);
    }

    // Validación crucial: ¿Es una fecha válida?
    if (isNaN(date.getTime())) {
      console.warn("Fecha inválida recibida:", timestamp);
      return 'Fecha no válida';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);

  } catch (error) {
    console.error("Error crítico en formatDate:", error);
    return 'Error en fecha';
  }
}

// --- 6. ACCIONES ---
const advanceOrder = async (order: Order) => {
  const nextStatus = getNextStatus(order.estado)
  if (!nextStatus) return

  updatingId.value = order.id
  try {
    await orderStore.updateOrderStatus(order.id, nextStatus as any)
  } catch (e) {
    console.error("Error al actualizar pedido:", e)
  } finally {
    updatingId.value = null
  }
}

const openDetails = (order: Order) => {
  selectedOrder.value = order
  detailsDialog.value = true
}

const cancelOrder = async (order: Order) => {
  if(!confirm('¿Estás seguro de cancelar este pedido?')) return

  await orderStore.updateOrderStatus(order.id, STATUSES.CANCELADO)
  detailsDialog.value = false
}

const clearStatusFilter = () => {
  selectedStatuses.value = []
}
</script>

<style scoped>
.order-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
}

.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.lh-1 { line-height: 1.2; }
.border-bottom { border-bottom: 1px solid rgba(0,0,0,0.08); }
.border-bottom-light { border-bottom: 1px solid rgba(0,0,0,0.04); }
.border-dashed { border-style: dashed !important; border-color: rgba(0,0,0,0.1); }
.font-mono { font-family: 'Roboto Mono', monospace; }
.letter-spacing-normal { letter-spacing: normal; }
</style>
