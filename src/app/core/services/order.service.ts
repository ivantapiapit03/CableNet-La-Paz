
import { Injectable, signal, inject } from '@angular/core';
import { Order, OrderCustomer, OrderItem } from '../models/order.model';
import { ProductService } from './product.service';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly storageKey = 'cablenet_orders';

  private readonly database = inject(DatabaseService);

  // Pedidos iniciales desde LocalStorage como respaldo
  orders = signal<Order[]>(this.loadOrders());

  // Control de modificaciones durante la inicialización
  private orderRevision = 0;

  // Cola para evitar escrituras simultáneas
  private persistenceQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly productService: ProductService
  ) {
    this.initializeOrders();
  }

  // ==========================================
  // RECUPERAR PEDIDOS DESDE LOCALSTORAGE
  // ==========================================

  private loadOrders(): Order[] {

    try {

      const data = localStorage.getItem(this.storageKey);

      if (!data) {
        return [];
      }

      const parsedOrders: Order[] = JSON.parse(data);

      if (!Array.isArray(parsedOrders)) {
        return [];
      }

      return parsedOrders.map(order => ({
        ...order,
        date: new Date(order.date)
      }));

    } catch (error) {

      console.error(
        'Error al recuperar pedidos desde LocalStorage:',
        error
      );

      return [];
    }
  }

  // ==========================================
  // INICIALIZAR PEDIDOS DESDE INDEXEDDB
  // ==========================================

  private async initializeOrders(): Promise<void> {

    const initialRevision = this.orderRevision;

    try {

      const storedOrders =
        await this.database.getAll<Order>('orders');

      // No sobrescribir cambios realizados durante la carga
      if (this.orderRevision !== initialRevision) {
        await this.persistOrders();
        return;
      }

      // Si IndexedDB tiene registros, será la fuente principal
      if (storedOrders.length > 0) {

        const validOrders = storedOrders.map(order => ({
          ...order,
          date: new Date(order.date)
        }));

        this.orders.set(validOrders);

        this.saveLocalOrders();

        console.info(
          `Pedidos recuperados desde IndexedDB: ${validOrders.length}`
        );

      } else {

        // Migración de LocalStorage hacia IndexedDB
        const localOrders = this.orders();

        if (localOrders.length > 0) {

          await this.persistOrders();

          console.info(
            `Pedidos migrados a IndexedDB: ${localOrders.length}`
          );

        } else {

          // Inicializar almacenamiento vacío
          await this.persistOrders();

          console.info(
            'IndexedDB inicializada para pedidos.'
          );
        }
      }

    } catch (error) {

      console.error(
        'Error al inicializar pedidos desde IndexedDB:',
        error
      );

      // Mantener los pedidos disponibles desde LocalStorage
    }
  }

  // ==========================================
  // RESPALDO LOCALSTORAGE
  // ==========================================

  private saveLocalOrders(): void {

    try {

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.orders())
      );

    } catch (error) {

      console.error(
        'Error al guardar pedidos en LocalStorage:',
        error
      );
    }
  }

  // ==========================================
  // PERSISTIR PEDIDOS EN INDEXEDDB
  // ==========================================

  private persistOrders(): Promise<void> {

    const snapshot = structuredClone(this.orders());

    // Respaldo inmediato
    this.saveLocalOrders();

    // Serializar las operaciones de persistencia
    this.persistenceQueue = this.persistenceQueue
      .then(async () => {

        // Sincronizar IndexedDB con el estado actual
        await this.database.clear('orders');

        // Guardar todos los pedidos del snapshot
        for (const order of snapshot) {

          await this.database.put(
            'orders',
            order
          );
        }

      })
      .catch(error => {

        console.error(
          'Error al persistir pedidos en IndexedDB:',
          error
        );
      });

    return this.persistenceQueue;
  }

  // ==========================================
  // REGISTRAR MODIFICACIÓN
  // ==========================================

  private saveOrders(): void {

    this.orderRevision++;

    void this.persistOrders();
  }

  // ==========================================
  // CREAR PEDIDO
  // ==========================================

  createOrder(
    customer: OrderCustomer,
    items: OrderItem[],
    total: number
  ): Order {

    const newOrder: Order = {
      id: Date.now(),
      date: new Date(),
      customer,
      items,
      total,
      status: 'PENDIENTE'
    };

    this.orders.update(currentOrders => [
      newOrder,
      ...currentOrders
    ]);

    this.saveOrders();

    console.info(
      `Pedido ${newOrder.id} registrado correctamente.`
    );

    return newOrder;
  }

  // ==========================================
  // OBTENER TODOS LOS PEDIDOS
  // ==========================================

  getOrders(): Order[] {
    return this.orders();
  }

  // ==========================================
  // BUSCAR PEDIDO POR ID
  // ==========================================

  getOrderById(id: number): Order | undefined {

    return this.orders().find(
      order => order.id === id
    );
  }

  // ==========================================
  // CANCELAR PEDIDO Y RESTAURAR INVENTARIO
  // ==========================================

  cancelOrder(id: number): boolean {

    const order = this.getOrderById(id);

    // Verificar existencia
    if (!order) {

      console.warn(
        `Pedido ${id} no encontrado.`
      );

      return false;
    }

    // Evitar cancelaciones duplicadas
    if (order.status !== 'PENDIENTE') {

      console.warn(
        `El pedido ${id} ya fue procesado.`
      );

      return false;
    }

    // Validar que todos los productos existan
    for (const item of order.items) {

      const product = this.productService.getProductById(
        item.productId
      );

      if (!product) {

        console.error(
          `Producto ${item.productId} no encontrado.`
        );

        return false;
      }
    }

    // Restaurar inventario
    for (const item of order.items) {

      const restored = this.productService.increaseStock(
        item.productId,
        item.quantity
      );

      if (!restored) {

        console.error(
          `No se pudo restaurar el stock del producto ${item.productId}.`
        );

        return false;
      }
    }

    // Actualizar estado del pedido
    this.orders.update(currentOrders =>
      currentOrders.map(currentOrder =>
        currentOrder.id === id
          ? {
              ...currentOrder,
              status: 'CANCELADO'
            }
          : currentOrder
      )
    );

    // Persistir cambios
    this.saveOrders();

    console.info(
      `Pedido ${id} cancelado. Stock restaurado.`
    );

    return true;
  }

  // ==========================================
  // ELIMINAR PEDIDO
  // ==========================================

  deleteOrder(id: number): void {

    this.orders.update(currentOrders =>
      currentOrders.filter(
        order => order.id !== id
      )
    );

    this.saveOrders();
  }

  // ==========================================
  // ELIMINAR TODOS LOS PEDIDOS
  // ==========================================

  clearOrders(): void {

    this.orders.set([]);

    this.saveOrders();
  }

}
