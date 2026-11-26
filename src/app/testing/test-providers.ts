import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DatabaseService } from '../core/services/database.service';
import { ProductService } from '../core/services/product.service';
import { CartService } from '../core/services/cart';
import { OrderService } from '../core/services/order.service';
import { Product } from '../core/models/product.model';

const databaseMock = {
  getAll: async <T>() => [] as T[],
  get: async <T>() => undefined as T | undefined,
  put: async () => undefined,
  add: async () => undefined,
  delete: async () => undefined,
  clear: async () => undefined,
  isAvailable: async () => false
};

const testProducts: Product[] = [
  { id: 101, name: 'Cable Cat 6', description: 'Cable de red', category: 'Cableado', brand: 'Furukawa', price: 100, stock: 10, image: '', active: true },
  { id: 102, name: 'Patch Panel', description: 'Panel de conexion', category: 'Conectividad', brand: 'Furukawa', price: 200, stock: 5, image: '', active: false }
];

const productMock = {
  initialized: signal(true),
  products: signal<Product[]>([...testProducts]),
  getProducts() { return this.products; },
  getActiveProducts() { return this.products().filter(product => product.active); },
  getProductById(id: number) { return this.products().find(product => product.id === id); },
  hasStock: (_id: number, _quantity: number) => true,
  decreaseStock: (_id: number, _quantity: number) => true,
  increaseStock: (_id: number, _quantity: number) => true,
  updateStock: (_id: number, _quantity: number) => true,
  updateProduct(updatedProduct: Product) {
    const exists = this.products().some(product => product.id === updatedProduct.id);
    if (!exists) return false;
    this.products.update(products => products.map(product => product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product));
    return true;
  }
};

const cartMock = {
  items: signal([]),
  total: signal(0),
  itemCount: signal(0),
  productCount: signal(0),
  addProduct: (_product: unknown, _quantity?: number) => true,
  updateQuantity: (_id: number, _quantity: number) => true,
  removeProduct: (_id: number) => undefined,
  clearCart: () => undefined
};

const orderMock = {
  orders: signal([]),
  getOrders: () => [],
  getOrderById: (_id: number) => undefined,
  createOrder: (_customer: unknown, _items: unknown[], _total: number) => ({ id: 1, date: new Date(), customer: _customer, items: _items, total: _total, status: 'PENDIENTE' as const }),
  cancelOrder: (_id: number) => true,
  deleteOrder: (_id: number) => undefined,
  clearOrders: () => undefined
};

export function resetProductMock(): void {
  productMock.products.set([...testProducts]);
  productMock.initialized.set(true);
}

export function provideTestDependencies() {
  return [
    provideRouter([]),
    { provide: DatabaseService, useValue: databaseMock },
    { provide: ProductService, useValue: productMock },
    { provide: CartService, useValue: cartMock },
    { provide: OrderService, useValue: orderMock }
  ];
}
