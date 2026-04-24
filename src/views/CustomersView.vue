<template>
  <v-container fluid class="py-8">
    <v-row class="mb-6" align="center">
      <v-col cols="12" md="8">
        <div class="d-flex align-center gap-2">
          <v-icon size="36" color="primary">mdi-account-multiple</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold">Gestión de clientes</h1>
            <p class="text-subtitle-2 text-grey">Registra clientes y consulta sus pedidos relacionados</p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4" class="text-md-right">
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openDialog()">
          Agregar cliente
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar por nombre, correo o teléfono..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="flat" class="border pa-3 h-100 d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-grey">Clientes visibles</div>
            <div class="text-h5 font-weight-bold">{{ filteredCustomers.length }}</div>
          </div>
          <div class="text-right">
            <div class="text-caption text-grey">Con pedidos</div>
            <div class="text-subtitle-1 font-weight-bold">{{ customersWithOrders }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="!filteredCustomers.length" class="text-center py-12 bg-grey-lighten-4 rounded-lg border">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-account-search-outline</v-icon>
      <p class="text-h6 text-grey-darken-1">No hay clientes para mostrar</p>
      <p class="text-body-2 text-grey">Crea el primero o ajusta la búsqueda.</p>
    </div>

    <v-row v-else>
      <v-col v-for="customer in filteredCustomers" :key="customer.id" cols="12" md="6" lg="4">
        <v-card class="h-100 d-flex flex-column" hover @click="openDetails(customer)">
          <v-card-item class="pb-1">
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <span class="text-subtitle-1 font-weight-bold">{{ getInitials(customer) }}</span>
              </v-avatar>
            </template>
            <v-card-title>{{ customer.nombre }} {{ customer.apellido }}</v-card-title>
            <v-card-subtitle>{{ customer.correo }}</v-card-subtitle>
            <template #append>
              <v-chip size="small" color="primary" variant="tonal">
                {{ getOrderCount(customer.id) }} pedido(s)
              </v-chip>
            </template>
          </v-card-item>

          <v-card-text class="pt-2 flex-grow-1">
            <div class="mb-2">
              <div class="text-caption text-grey">Teléfono</div>
              <div class="text-body-2">{{ customer.telefono }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-grey">Dirección</div>
              <div class="text-body-2 text-truncate">{{ customer.direccion || 'Sin dirección' }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">Último pedido</div>
              <div class="text-body-2">{{ formatDate(getLastOrderDate(customer.id) || customer.lastOrderAt) }}</div>
            </div>
          </v-card-text>

          <v-divider />

          <v-card-actions class="bg-grey-lighten-5">
            <v-btn variant="text" color="primary" @click.stop="openDialog(customer)">Editar</v-btn>
            <v-spacer />
            <v-btn variant="text" color="error" @click.stop="confirmDelete(customer)">Eliminar</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="620" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white pa-4">
          {{ editingId ? 'Editar cliente' : 'Crear cliente' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="saveCustomer">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="formData.nombre" label="Nombre" variant="outlined" :rules="[rules.required]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="formData.apellido" label="Apellido" variant="outlined" :rules="[rules.required]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.correo" label="Correo" variant="outlined" :rules="[rules.required, rules.email]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.telefono" label="Teléfono" variant="outlined" :rules="[rules.required, rules.phone]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.direccion" label="Dirección" variant="outlined" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="formData.notas" label="Notas" variant="outlined" rows="3" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="customerStore.loading" @click="saveCustomer">
            {{ editingId ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailsDialog" max-width="760">
      <v-card v-if="selectedCustomer">
        <v-toolbar color="white" class="border-bottom">
          <v-toolbar-title>{{ selectedCustomer.nombre }} {{ selectedCustomer.apellido }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="detailsDialog = false" />
        </v-toolbar>

        <v-card-text class="pa-4">
          <v-row class="mb-2">
            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Correo</div>
              <div>{{ selectedCustomer.correo }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Teléfono</div>
              <div>{{ selectedCustomer.telefono }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Dirección</div>
              <div>{{ selectedCustomer.direccion || 'Sin dirección' }}</div>
            </v-col>
          </v-row>

          <div class="text-subtitle-1 font-weight-bold mb-3">Pedidos relacionados</div>
          <v-list v-if="selectedCustomerOrders.length" density="compact" class="border rounded">
            <v-list-item v-for="order in selectedCustomerOrders" :key="order.id" to="/pedidos">
              <v-list-item-title>
                #{{ formatId(order.id) }} - {{ formatCurrency(order.resumen.total) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ order.estado }} · {{ formatDate(order.fecha) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else class="pa-4 text-center text-grey border rounded">
            Este cliente todavía no tiene pedidos relacionados.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">Eliminar cliente</v-card-title>
        <v-card-text class="pt-6">
          ¿Seguro que deseas eliminar a <strong>{{ deleteTarget?.nombre }} {{ deleteTarget?.apellido }}</strong>?
          Los pedidos existentes seguirán mostrando el snapshot del cliente guardado en cada orden.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="customerStore.loading" @click="deleteCustomer">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { useOrderStore } from '@/stores/useOrderStore'
import type { Customer } from '@/types/customer'
import type { Order } from '@/types/order'

type CustomerForm = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'lastOrderAt' | 'lastOrderId' | 'correoNormalizado' | 'telefonoNormalizado'>

const customerStore = useCustomerStore()
const orderStore = useOrderStore()

const searchQuery = ref('')
const dialog = ref(false)
const detailsDialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<string | null>(null)
const selectedCustomer = ref<Customer | null>(null)
const deleteTarget = ref<Customer | null>(null)
const formRef = ref()

const formData = ref<CustomerForm>({
  nombre: '',
  apellido: '',
  telefono: '',
  correo: '',
  direccion: '',
  notas: '',
})

const snackbar = ref({ show: false, message: '', color: 'success', timeout: 3000 })

const rules = {
  required: (v: string) => !!v || 'Este campo es obligatorio',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Ingresa un correo válido',
  phone: (v: string) => v.replace(/\D/g, '').length >= 10 || 'Ingresa un teléfono válido',
}

const ordersByCustomerId = computed(() => {
  const map = new Map<string, Order[]>()

  for (const order of orderStore.orders) {
    if (!order.clienteId) continue
    const current = map.get(order.clienteId) || []
    current.push(order)
    map.set(order.clienteId, current)
  }

  return map
})

const filteredCustomers = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()
  if (!term) return customerStore.customers

  return customerStore.customers.filter((customer) => {
    const fullName = `${customer.nombre} ${customer.apellido}`.toLowerCase()
    return (
      fullName.includes(term) ||
      customer.correo.toLowerCase().includes(term) ||
      customer.telefono.includes(term)
    )
  })
})

const customersWithOrders = computed(() =>
  customerStore.customers.filter((customer) => getOrderCount(customer.id) > 0).length
)

const selectedCustomerOrders = computed(() => {
  if (!selectedCustomer.value) return []
  return [...(ordersByCustomerId.value.get(selectedCustomer.value.id) || [])]
    .sort((a, b) => getDateValue(b.fecha) - getDateValue(a.fecha))
})

const resetForm = () => {
  formData.value = {
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    direccion: '',
    notas: '',
  }
  if (formRef.value?.resetValidation) formRef.value.resetValidation()
}

const openDialog = (customer?: Customer) => {
  if (customer) {
    editingId.value = customer.id
    formData.value = {
      nombre: customer.nombre,
      apellido: customer.apellido,
      telefono: customer.telefono,
      correo: customer.correo,
      direccion: customer.direccion,
      notas: customer.notas || '',
    }
  } else {
    editingId.value = null
    resetForm()
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editingId.value = null
  resetForm()
}

const saveCustomer = async () => {
  const result = await formRef.value?.validate?.()
  if (result && !result.valid) return

  try {
    const payload = {
      ...formData.value,
      nombre: formData.value.nombre.trim(),
      apellido: formData.value.apellido.trim(),
      telefono: formData.value.telefono.trim(),
      correo: formData.value.correo.trim(),
      direccion: formData.value.direccion.trim(),
      notas: formData.value.notas?.trim() || '',
    }

    if (editingId.value) {
      await customerStore.updateCustomer(editingId.value, payload)
      snackbar.value = { show: true, message: 'Cliente actualizado', color: 'success', timeout: 3000 }
    } else {
      await customerStore.createCustomer(payload)
      snackbar.value = { show: true, message: 'Cliente creado', color: 'success', timeout: 3000 }
    }

    closeDialog()
  } catch (error) {
    console.error('Error guardando cliente:', error)
    snackbar.value = { show: true, message: 'No se pudo guardar el cliente', color: 'error', timeout: 4000 }
  }
}

const openDetails = (customer: Customer) => {
  selectedCustomer.value = customer
  detailsDialog.value = true
}

const confirmDelete = (customer: Customer) => {
  deleteTarget.value = customer
  deleteDialog.value = true
}

const deleteCustomer = async () => {
  if (!deleteTarget.value) return

  try {
    await customerStore.deleteCustomer(deleteTarget.value.id)
    snackbar.value = { show: true, message: 'Cliente eliminado', color: 'success', timeout: 3000 }
    deleteDialog.value = false
    if (selectedCustomer.value?.id === deleteTarget.value.id) {
      detailsDialog.value = false
      selectedCustomer.value = null
    }
    deleteTarget.value = null
  } catch (error) {
    console.error('Error eliminando cliente:', error)
    snackbar.value = { show: true, message: 'No se pudo eliminar el cliente', color: 'error', timeout: 4000 }
  }
}

const getOrderCount = (customerId: string) => ordersByCustomerId.value.get(customerId)?.length || 0

const getLastOrderDate = (customerId: string) => {
  const orders = ordersByCustomerId.value.get(customerId) || []
  const sorted = [...orders].sort((a, b) => getDateValue(b.fecha) - getDateValue(a.fecha))
  return sorted[0]?.fecha
}

const getInitials = (customer: Customer) => {
  const base = `${customer.nombre} ${customer.apellido}`.trim()
  if (!base) return '?'
  return base
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

const toDate = (timestamp: any): Date | null => {
  try {
    if (!timestamp) return null
    if (typeof timestamp.toDate === 'function') return timestamp.toDate()
    if (timestamp instanceof Date) return timestamp
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000)
    const parsed = new Date(timestamp)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

const getDateValue = (timestamp: any) => toDate(timestamp)?.getTime() || 0

const formatDate = (timestamp: any) => {
  const date = toDate(timestamp)
  if (!date) return 'Sin pedidos'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatId = (id: string) => (id ? id.slice(-6).toUpperCase() : '---')

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

onMounted(() => {
  customerStore.listenCustomers()
  orderStore.fetchOrders()
})

onUnmounted(() => {
  customerStore.stopListeningCustomers()
})
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}

.border {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
