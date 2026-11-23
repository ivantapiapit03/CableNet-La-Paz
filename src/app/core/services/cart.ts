import { Injectable, computed, signal, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { DatabaseService } from './database.service';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly storageKey = 'cablenet_cart';
  private readonly indexedDBKey = 'current_cart';

  private readonly database = inject(DatabaseService);

  // Carrito inicial desde LocalStorage como respaldo inmediato
  private readonly cartItems = signal<CartItem[]>(this.loadCart());

  // Exponer productos del carrito
  items = this.cartItems.asReadonly();

  // Total monetario
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

  // Control de modificaciones realizadas durante la inicialización
  private cartRevision = 0;

  // Cola de persistencia para evitar escrituras simultáneas
  private persistenceQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.initializeCart();
  }

  // ==========================================
  // RECUPERAR CARRITO DESDE LOCALSTORAGE
  // ==========================================

  private loadCart(): CartItem[] {
    try {
      const storedCart = localStorage.getItem(this.storageKey);

      if (!storedCart) {
        return [];
      }

      const parsedCart: CartItem[] = JSON.parse(storedCart);

      if (!Array.isArray(parsedCart)) {
        return [];
      }

      return parsedCart
        .filter(item =>
          item &&
          item.product &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
        )
        .map(item => ({
          ...item,
          subtotal: item.product.price * item.quantity
        }));

    } catch (error) {
      console.error('Error al recuperar el carrito:', error);
      return [];
    }
  }

  // ==========================================
  // INICIALIZAR CARRITO DESDE INDEXEDDB
  // ==========================================

  private async initializeCart(): Promise<void> {

    const initialRevision = this.cartRevision;

    try {

      const storedCart = await this.database.get<CartItem[]>(
        'cart',
        this.indexedDBKey
      );

      // Si el carrito fue modificado durante la carga,
      // no sobrescribir los cambios del usuario
      if (this.cartRevision !== initialRevision) {
        await this.persistCart();
        return;
      }

      if (Array.isArray(storedCart)) {

        const validCart = storedCart
          .filter(item =>
            item &&
            item.product &&
            typeof item.quantity === 'number' &&
            item.quantity > 0
          )
          .map(item => ({
            ...item,
            subtotal: item.product.price * item.quantity
          }));

        this.cartItems.set(validCart);
        this.saveLocalCart();

      } else {

        // Migrar el carrito existente de LocalStorage a IndexedDB
        await this.persistCart();
      }

    } catch (error) {
      console.error(
        'Error al inicializar el carrito desde IndexedDB:',
        error
      );
    }
  }

  // ==========================================
  // RESPALDO LOCALSTORAGE
  // ==========================================

  private saveLocalCart(): void {

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.cartItems())
      );

    } catch (error) {
      console.error(
        'Error al guardar el carrito en LocalStorage:',
        error
      );
    }
  }

  // ==========================================
  // GUARDAR CARRITO EN INDEXEDDB
  // ==========================================

  private persistCart(): Promise<void> {

    const cartSnapshot = structuredClone(this.cartItems());

    this.saveLocalCart();

    this.persistenceQueue = this.persistenceQueue
      .then(() =>
        this.database.put(
          'cart',
          cartSnapshot,
          this.indexedDBKey
        )
      )
      .catch(error => {
        console.error(
          'Error al guardar el carrito en IndexedDB:',
          error
        );
      });

    return this.persistenceQueue;
  }

  // ==========================================
  // REGISTRAR MODIFICACIÓN DEL CARRITO
  // ==========================================

  private saveCart(): void {

    this.cartRevision++;

    void this.persistCart();
  }

  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  addProduct(
    product: Product,
    quantity: number = 1
  ): boolean {

    if (quantity <= 0 || product.stock <= 0) {
      return false;
    }

    const currentItems = this.cartItems();

    const existingItem = currentItems.find(
      item => item.product.id === product.id
    );

    const currentQuantity = existingItem?.quantity ?? 0;
    const newQuantity = currentQuantity + quantity;

    // Validar stock
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

    this.saveCart();

    return true;
  }

  // ==========================================
  // ACTUALIZAR CANTIDAD
  // ==========================================

  updateQuantity(
    productId: number,
    quantity: number
  ): boolean {

    const item = this.cartItems().find(
      item => item.product.id === productId
    );

    if (
      !item ||
      quantity <= 0 ||
      quantity > item.product.stock
    ) {
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

    this.saveCart();

    return true;
  }

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  removeProduct(productId: number): void {

    this.cartItems.update(items =>
      items.filter(item => item.product.id !== productId)
    );

    this.saveCart();
  }

  // ==========================================
  // VACIAR CARRITO
  // ==========================================

  clearCart(): void {

    this.cartItems.set([]);

    this.saveCart();
  }

}