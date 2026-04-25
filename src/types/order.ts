export type OrderStatus =
  | 'Recibido'
  | 'Preparando'
  | 'En Camino'
  | 'Entregado'
  | 'Cancelado'

export interface Cliente {
  id?: string
  pkey?: string
  nombre: string
  apellido: string
  telefono: string
  correo: string
  direccion: string
}

export interface Producto {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Resumen {
  subtotal: number
  envio: number
  total: number
}

export interface Order {
  id: string
  estado: OrderStatus
  fecha: any
  clienteId?: string
  cliente: Cliente
  metodoEntrega: string
  productos: Producto[]
  resumen: Resumen
}
