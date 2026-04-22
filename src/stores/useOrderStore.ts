import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy
} from 'firebase/firestore'

import type { Order, OrderStatus } from '@/types/order'

export const useOrderStore = defineStore('orders', () => {

  const orders = ref<Order[]>([])
  const loading = ref(true)

  let unsubscribe: (() => void) | null = null

  const fetchOrders = () => {

    if (unsubscribe) unsubscribe()

    const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'))

    unsubscribe = onSnapshot(q, (snapshot) => {

      orders.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Order,'id'>)
      }))

      loading.value = false
    })
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateDoc(doc(db,'pedidos',orderId),{ estado: status })
  }

  const cancelOrder = async (orderId: string) => {
    await updateDoc(doc(db,'pedidos',orderId),{ estado:'Cancelado' })
  }

  return { orders, loading, fetchOrders, updateOrderStatus, cancelOrder }

})
