import { Injectable, signal, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly storageKey = 'cablenet_products';
  private readonly db = inject(DatabaseService);

  // Indica si la carga del inventario terminó
  readonly initialized = signal(false);

  // ==========================================
  // INVENTARIO INICIAL
  // ==========================================

  private readonly initialProducts: Product[] = [
    {
      id: 1,
      name: 'Cable UTP Cat 6',
      description: 'Cable de red para instalaciones estructuradas.',
      category: 'Cableado',
      brand: 'Furukawa',
      price: 5,
      stock: 250,
      image: '/images/products/cable-utp-cat6.jpg',
      active: true
    },
    {
      id: 2,
      name: 'Patch Panel Cat 6 de 24 puertos',
      description: 'Panel de conexión para rack de comunicaciones.',
      category: 'Conectividad',
      brand: 'Furukawa',
      price: 450,
      stock: 15,
      image: '/images/products/patch-panel-cat6.jpg',
      active: true
    },
    {
      id: 3,
      name: 'Patch Cord Cat 6',
      description: 'Cable de conexión Ethernet para equipos de red.',
      category: 'Conectividad',
      brand: 'Furukawa',
      price: 35,
      stock: 80,
      image: '/images/products/patch-cord-cat6.jpg',
      active: true
    },
    {
      id: 4,
      name: 'Tester de cableado',
      description: 'Equipo para pruebas de cableado y diagnóstico.',
      category: 'Instrumentación',
      brand: 'Fluke Networks',
      price: 850,
      stock: 5,
      image: '/images/products/tester-cable.jpg',
      active: true
    }
  ];

  // ==========================================
  // SIGNAL DE PRODUCTOS
  // ==========================================

  private readonly products = signal<Product[]>(
    this.loadLocalProducts()
  );

  // Cola para evitar escrituras simultáneas desordenadas
  private persistenceQueue: Promise<void> = Promise.resolve();

  // ==========================================
  // INICIALIZACIÓN Y MIGRACIÓN
  // ==========================================

  constructor() {
    this.initializeInventory();
  }

  private loadLocalProducts(): Product[] {

    try {
      const data = localStorage.getItem(this.storageKey);

      if (!data) {
        return [...this.initialProducts];
      }

      const savedProducts: Product[] = JSON.parse(data);

      return Array.isArray(savedProducts)
        ? savedProducts
        : [...this.initialProducts];

    } catch (error) {
      console.error('Error al cargar inventario local:', error);
      return [...this.initialProducts];
    }
  }

  private async initializeInventory(): Promise<void> {

    try {

      // 1. Consultar productos existentes en IndexedDB
      const storedProducts = await this.db.getAll<Product>('products');

      if (storedProducts.length > 0) {

        // 2. IndexedDB es la fuente principal
        this.products.set(storedProducts);

        // 3. Actualizar respaldo local
        this.saveLocalProducts(storedProducts);

      } else {

        // 4. Si IndexedDB está vacío, recuperar localStorage
        const localProducts = this.loadLocalProducts();

        this.products.set(localProducts);

        // 5. Migrar inventario a IndexedDB
        await this.persistProducts(localProducts);
      }

    } catch (error) {

      console.error(
        'Error inicializando IndexedDB. Se utilizará localStorage:',
        error
      );

      this.products.set(this.loadLocalProducts());

    } finally {

      // La inicialización terminó, incluso si hubo error
      this.initialized.set(true);
    }
  }

  // ==========================================
  // PERSISTENCIA
  // ==========================================

  private saveLocalProducts(products: Product[]): void {

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error guardando respaldo local:', error);
    }
  }

  private persistProducts(products: Product[]): Promise<void> {

    // Serializar las escrituras para evitar conflictos
    this.persistenceQueue = this.persistenceQueue.then(async () => {

      for (const product of products) {
        await this.db.put('products', product);
      }

      this.saveLocalProducts(products);

    }).catch(error => {

      console.error('Error guardando productos en IndexedDB:', error);

      // Mantener respaldo local ante errores
      this.saveLocalProducts(this.products());
    });

    return this.persistenceQueue;
  }

  private saveProducts(): void {

    const currentProducts = this.products();

    // Respaldo local inmediato
    this.saveLocalProducts(currentProducts);

    // Persistencia en IndexedDB
    void this.persistProducts(currentProducts);
  }

  // ==========================================
  // CONSULTAS DE PRODUCTOS
  // ==========================================

  getProducts() {
    return this.products;
  }

  getActiveProducts() {
    return this.products().filter(product => product.active);
  }

  getProductById(id: number) {
    return this.products().find(product => product.id === id);
  }

  searchProducts(term: string) {

    const normalizedTerm = term.trim().toLowerCase();

    return this.products().filter(product =>
      product.active &&
      (
        product.name.toLowerCase().includes(normalizedTerm) ||
        product.description.toLowerCase().includes(normalizedTerm) ||
        product.brand.toLowerCase().includes(normalizedTerm)
      )
    );
  }

  getProductsByCategory(category: string) {
    return this.products().filter(product =>
      product.active && product.category === category
    );
  }

  // ==========================================
  // CONTROL DE INVENTARIO
  // ==========================================

  getStock(productId: number): number | undefined {
    return this.getProductById(productId)?.stock;
  }

  hasStock(productId: number, quantity: number): boolean {

    const product = this.getProductById(productId);

    return !!product &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      product.stock >= quantity;
  }

  // Descontar stock
  decreaseStock(productId: number, quantity: number): boolean {

    if (!this.initialized() || !this.hasStock(productId, quantity)) {
      return false;
    }

    this.products.update(products =>
      products.map(product =>
        product.id === productId
          ? { ...product, stock: product.stock - quantity }
          : product
      )
    );

    this.saveProducts();

    return true;
  }

  // Restituir stock
  increaseStock(productId: number, quantity: number): boolean {

    const product = this.getProductById(productId);

    if (
      !this.initialized() ||
      !product ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return false;
    }

    this.products.update(products =>
      products.map(product =>
        product.id === productId
          ? { ...product, stock: product.stock + quantity }
          : product
      )
    );

    this.saveProducts();

    return true;
  }

  // Actualizar stock manualmente
  updateStock(productId: number, newStock: number): boolean {

    const product = this.getProductById(productId);

    if (
      !this.initialized() ||
      !product ||
      !Number.isInteger(newStock) ||
      newStock < 0
    ) {
      return false;
    }

    this.products.update(products =>
      products.map(product =>
        product.id === productId
          ? { ...product, stock: newStock }
          : product
      )
    );

    this.saveProducts();

    return true;
  }
}