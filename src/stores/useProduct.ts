import { defineStore } from 'pinia'
import { db } from '@/firebase'
import type { Product, Category } from '@/types/product'

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Array<{ id: string; data: Product }>,
    categories: [] as Category[],
    loading: false,
    productsUnsubscribe: null as null | (() => void),
  }),

  actions: {
    listenProducts() {
      if (this.productsUnsubscribe) {
        this.productsUnsubscribe()
      }

      const q = query(collection(db, 'products'), orderBy('name'))

      this.productsUnsubscribe = onSnapshot(q, (snapshot) => {
        this.products = snapshot.docs.map((d) => ({
          id: d.id,
          data: d.data() as Product,
        }))
      })
    },

    stopListeningProducts() {
      if (this.productsUnsubscribe) {
        this.productsUnsubscribe()
        this.productsUnsubscribe = null
      }
    },

    async fetchCategories() {
      const snap = await getDocs(collection(db, 'categories'))
      this.categories = snap.docs.map((d) => ({
        ...(d.data() as Category),
        id: d.id,
      }))
    },

    async createCategory(payload: Omit<Category, 'id'>) {
      this.loading = true
      try {
        const ref = await addDoc(collection(db, 'categories'), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        const newCategory = { id: ref.id, ...payload }
        this.categories = [...this.categories, newCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
        return ref.id
      } finally {
        this.loading = false
      }
    },

    async updateCategory(id: string, payload: Partial<Omit<Category, 'id'>>) {
      this.loading = true
      try {
        const ref = doc(db, 'categories', id)
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        })
        this.categories = this.categories.map((c) =>
          c.id === id ? { ...c, ...payload } : c
        )
      } finally {
        this.loading = false
      }
    },

    async deleteCategory(id: string) {
      this.loading = true
      try {
        await deleteDoc(doc(db, 'categories', id))
        this.categories = this.categories.filter((c) => c.id !== id)
      } finally {
        this.loading = false
      }
    },

    async createProduct(payload: Product) {
      this.loading = true
      try {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } finally {
        this.loading = false
      }
    },

    async updateProduct(id: string, payload: Partial<Product>) {
      this.loading = true
      try {
        const ref = doc(db, 'products', id)
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        })
      } finally {
        this.loading = false
      }
    },

    async deleteProduct(id: string) {
      this.loading = true
      try {
        await deleteDoc(doc(db, 'products', id))
      } finally {
        this.loading = false
      }
    },
  },
})
