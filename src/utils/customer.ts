import { collection, getDocs, limit, query, where, type Firestore } from 'firebase/firestore'

const PKEY_BYTES = 16
const PKEY_PREFIX = 'cli_'
const PKEY_MAX_ATTEMPTS = 5

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

const createCandidatePkey = () => {
  const bytes = new Uint8Array(PKEY_BYTES)
  crypto.getRandomValues(bytes)
  return `${PKEY_PREFIX}${toHex(bytes)}`
}

export const normalizeEmail = (value: string) => value.trim().toLowerCase()
export const normalizePhone = (value: string) => value.replace(/\D/g, '')

export const generateUniqueCustomerPkey = async (db: Firestore) => {
  for (let attempt = 0; attempt < PKEY_MAX_ATTEMPTS; attempt += 1) {
    const candidate = createCandidatePkey()
    const snapshot = await getDocs(
      query(collection(db, 'clientes'), where('pkey', '==', candidate), limit(1))
    )

    if (snapshot.empty) {
      return candidate
    }
  }

  throw new Error('No fue posible generar un pkey unico para el cliente.')
}
