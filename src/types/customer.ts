export interface Customer {
  id: string
  pkey?: string
  nombre: string
  apellido: string
  telefono: string
  telefonoNormalizado: string
  correo: string
  correoNormalizado: string
  direccion: string
  notas?: string
  createdAt?: unknown
  updatedAt?: unknown
  lastOrderAt?: unknown
  lastOrderId?: string
}
