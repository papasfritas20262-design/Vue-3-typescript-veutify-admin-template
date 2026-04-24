import { defineStore } from 'pinia'
import { db } from '@/firebase'
import type { Customer } from '@/types/customer'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

type CustomerPayload = Omit<
  Customer,
  'id' | 'createdAt' | 'updatedAt' | 'lastOrderAt' | 'lastOrderId' | 'correoNormalizado' | 'telefonoNormalizado'
>

const normalizeEmail = (value: string) => value.trim().toLowerCase()
const normalizePhone = (value: string) => value.replace(/\D/g, '')

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [] as Customer[],
    loading: false,
    unsubscribe: null as null | (() => void),
  }),

  actions: {
    listenCustomers() {
      if (this.unsubscribe) this.unsubscribe()

      this.unsubscribe = onSnapshot(collection(db, 'clientes'), (snapshot) => {
        this.customers = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Customer, 'id'>),
          }))
          .sort((a, b) =>
            `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, 'es')
          )
      })
    },

    stopListeningCustomers() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    },

    async createCustomer(payload: CustomerPayload) {
      this.loading = true
      try {
        const normalizedPayload = {
          ...payload,
          correoNormalizado: normalizeEmail(payload.correo),
          telefonoNormalizado: normalizePhone(payload.telefono),
        }

        const ref = await addDoc(collection(db, 'clientes'), {
          ...normalizedPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        return ref.id
      } finally {
        this.loading = false
      }
    },

    async updateCustomer(id: string, payload: Partial<CustomerPayload>) {
      this.loading = true
      try {
        const nextPayload: Record<string, unknown> = {
          ...payload,
          updatedAt: serverTimestamp(),
        }

        if (typeof payload.correo === 'string') {
          nextPayload.correoNormalizado = normalizeEmail(payload.correo)
        }

        if (typeof payload.telefono === 'string') {
          nextPayload.telefonoNormalizado = normalizePhone(payload.telefono)
        }

        await updateDoc(doc(db, 'clientes', id), nextPayload)
      } finally {
        this.loading = false
      }
    },

    async deleteCustomer(id: string) {
      this.loading = true
      try {
        await deleteDoc(doc(db, 'clientes', id))
      } finally {
        this.loading = false
      }
    },
  },
})
