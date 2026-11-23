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
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}