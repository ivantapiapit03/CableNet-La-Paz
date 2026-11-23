import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // Productos almacenados en el carrito
  private readonly cartItems = signal<CartItem[]>([]);

  // Exponer los productos del carrito
  items = this.cartItems.asReadonly();

  // Total monetario del carrito
  total = computed(() =>
    this.cartItems().reduce(
      (sum, item) => sum + item.subtotal,
      0
    )
  );

  // Cantidad total de unidades
  itemCount = computed(() =>
    this.cartItems().reduce(
      (sum, item) => sum + item.quantity,
      0
    )
  );

  // Cantidad de productos diferentes
  productCount = computed(() =>
    this.cartItems().length
  );

  // Agregar producto al carrito
  addProduct(product: Product, quantity: number = 1): boolean {

    if (quantity <= 0 || product.stock <= 0) {
      return false;
    }

    const currentItems = this.cartItems();
    const existingItem = currentItems.find(
      item => item.product.id === product.id
    );

    const currentQuantity = existingItem?.quantity ?? 0;
    const newQuantity = currentQuantity + quantity;

    // Validar stock disponible
    if (newQuantity > product.stock) {
      return false;
    }

    if (existingItem) {

      this.cartItems.update(items =>
        items.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: product.price * newQuantity
              }
            : item
        )
      );

    } else {

      this.cartItems.update(items => [
        ...items,
        {
          product,
          quantity,
          subtotal: product.price * quantity
        }
      ]);

    }

    return true;
  }

  // Cambiar cantidad de un producto
  updateQuantity(productId: number, quantity: number): boolean {

    const item = this.cartItems().find(
      item => item.product.id === productId
    );

    if (!item || quantity <= 0 || quantity > item.product.stock) {
      return false;
    }

    this.cartItems.update(items =>
      items.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: item.product.price * quantity
            }
          : item
      )
    );

    return true;
  }

  // Eliminar producto
  removeProduct(productId: number): void {

    this.cartItems.update(items =>
      items.filter(item => item.product.id !== productId)
    );

  }

  // Vaciar carrito
  clearCart(): void {
    this.cartItems.set([]);
  }

}