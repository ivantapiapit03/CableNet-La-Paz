export interface OrderCustomer {
  nombreCompleto: string;
  empresa: string;
  nit: string;
  telefono: string;
  correo: string;
  direccion: string;
  observaciones: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'PENDIENTE' | 'CANCELADO';

export interface Order {
  id: number;
  date: Date;
  customer: OrderCustomer;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}