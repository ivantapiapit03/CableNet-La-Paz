
import { Injectable, signal, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly storageKey = 'cablenet_products';

  private readonly furukawaMigrationKey =
    'cablenet_migration_furukawa_cat6_v1';

  private readonly textMigrationKey =
    'cablenet_migration_product_texts_utf8_v1';

  // Nueva migración comercial Cat 6A y Cat 7
  private readonly cableCategoryMigrationKey =
    'cablenet_migration_cat6a_cat7_v1';

  private readonly db = inject(DatabaseService);

  readonly initialized = signal(false);

  // ==========================================
  // INVENTARIO INICIAL
  // ==========================================

  private readonly initialProducts: Product[] = [
    {
      id: 1,
      name: 'Cable UTP Furukawa Cat 6',
      description:
        'Cable de red Furukawa Gigalan Cat 6 para instalaciones de cableado estructurado. Presentación en caja de 305 metros.',
      category: 'Cableado',
      brand: 'Furukawa',
      price: 2850,
      stock: 10,
      image: '/images/products/cable-utp-cat6.jpg',
      active: true,
      unit: 'caja',
      presentation: 'Caja de 305 metros',
      metersPerUnit: 305
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

  private persistenceQueue: Promise<void> = Promise.resolve();

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {
    this.initializeInventory();
  }

  // ==========================================
  // CARGA LOCAL
  // ==========================================

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

  // ==========================================
  // INICIALIZACIÓN Y MIGRACIONES
  // ==========================================

  private async initializeInventory(): Promise<void> {

    try {

      const storedProducts =
        await this.db.getAll<Product>('products');

      if (storedProducts.length > 0) {

        this.products.set(storedProducts);
        this.saveLocalProducts(storedProducts);

      } else {

        const localProducts = this.loadLocalProducts();

        this.products.set(localProducts);

        await this.persistProducts(localProducts);
      }

      // Migración comercial Furukawa Cat 6
      await this.migrateFurukawaProduct();

      // Migración de textos UTF-8
      await this.migrateProductTexts();

      // Nueva migración Cat 6A y Cat 7
      await this.migrateCableCategoryProducts();

    } catch (error) {

      console.error(
        'Error inicializando IndexedDB. Se utilizará localStorage:',
        error
      );

      this.products.set(this.loadLocalProducts());

    } finally {

      this.initialized.set(true);
    }
  }

  // ==========================================
  // MIGRACIÓN COMERCIAL FURUKAWA CAT 6
  // ==========================================

  private async migrateFurukawaProduct(): Promise<void> {

    try {

      if (
        localStorage.getItem(this.furukawaMigrationKey) === 'completed'
      ) {
        return;
      }

      const product = this.getProductById(1);

      if (!product) {
        console.warn(
          'Migración Furukawa: producto ID 1 no encontrado.'
        );
        return;
      }

      const updatedProduct: Product = {
        ...product,
        id: 1,
        name: 'Cable UTP Furukawa Cat 6',
        description:
          'Cable de red Furukawa Gigalan Cat 6 para instalaciones de cableado estructurado. Presentación en caja de 305 metros.',
        category: 'Cableado',
        brand: 'Furukawa',
        price: 2850,
        stock: 10,
        image: '/images/products/cable-utp-cat6.jpg',
        active: true,
        unit: 'caja',
        presentation: 'Caja de 305 metros',
        metersPerUnit: 305
      };

      const updatedProducts = this.products().map(product =>
        product.id === 1 ? updatedProduct : product
      );

      await this.db.put('products', updatedProduct);

      this.products.set(updatedProducts);
      this.saveLocalProducts(updatedProducts);

      localStorage.setItem(
        this.furukawaMigrationKey,
        'completed'
      );

      console.log(
        'Migración Furukawa Cat 6 completada correctamente.'
      );

    } catch (error) {

      console.error(
        'Error ejecutando migración Furukawa Cat 6:',
        error
      );
    }
  }

  // ==========================================
  // MIGRACIÓN DE TEXTOS UTF-8
  // ==========================================

  private async migrateProductTexts(): Promise<void> {

    try {

      if (
        localStorage.getItem(this.textMigrationKey) === 'completed'
      ) {
        return;
      }

      const textCorrections: Record<number, Partial<Product>> = {
        2: {
          description: 'Panel de conexión para rack de comunicaciones.'
        },
        3: {
          description: 'Cable de conexión Ethernet para equipos de red.'
        },
        4: {
          description: 'Equipo para pruebas de cableado y diagnóstico.',
          category: 'Instrumentación'
        }
      };

      const currentProducts = this.products();

      const updatedProducts = currentProducts.map(product => {
        const correction = textCorrections[product.id];

        return correction
          ? { ...product, ...correction }
          : product;
      });

      for (const product of updatedProducts) {

        if (textCorrections[product.id]) {
          await this.db.put('products', product);
        }
      }

      this.products.set(updatedProducts);
      this.saveLocalProducts(updatedProducts);

      localStorage.setItem(
        this.textMigrationKey,
        'completed'
      );

      console.info(
        'Migración de textos UTF-8 completada correctamente.'
      );

    } catch (error) {

      console.error(
        'Error ejecutando migración de textos UTF-8:',
        error
      );
    }
  }

  // ==========================================
  // MIGRACIÓN COMERCIAL CAT 6A Y CAT 7
  // ==========================================

  private async migrateCableCategoryProducts(): Promise<void> {

    try {

      // Evitar ejecutar nuevamente la migración
      if (
        localStorage.getItem(this.cableCategoryMigrationKey) ===
        'completed'
      ) {
        return;
      }

      // Productos que se incorporarán al catálogo
      const newProducts: Omit<Product, 'id'>[] = [

        {
          name: 'Cable UTP Furukawa Cat 6A',
          description:
            'Cable de cobre para cableado estructurado categoría 6A. Presentación comercial de referencia en caja de 305 metros. Precio referencial sujeto a cotización.',
          category: 'Cableado',
          brand: 'Furukawa',
          price: 3622.50,
          stock: 0,
          image: '/images/products/cable-utp-cat6.jpg',
          active: true,
          unit: 'caja',
          presentation: 'Caja de 305 metros',
          metersPerUnit: 305
        },

        {
          name: 'Cable UTP Furukawa Cat 7',
          description:
            'Cable de categoría 7 para instalaciones de cableado estructurado. Precio estimado, pendiente de validación comercial y técnica. Presentación referencial de 305 metros.',
          category: 'Cableado',
          brand: 'Furukawa',
          price: 4500,
          stock: 0,
          image: '/images/products/cable-utp-cat6.jpg',
          active: false,
          unit: 'caja',
          presentation: 'Caja de 305 metros',
          metersPerUnit: 305
        }
      ];

      // Trabajar con una copia de los productos actuales
      let currentProducts = [...this.products()];

      for (const newProduct of newProducts) {

        // Comprobar si ya existe un producto equivalente
        const exists = currentProducts.some(product =>
          product.name.trim().toLowerCase() ===
          newProduct.name.trim().toLowerCase()
        );

        if (exists) {
          console.info(
            `Producto ya registrado, se omite: ${newProduct.name}`
          );
          continue;
        }

        // Obtener el siguiente ID disponible
        const nextId = currentProducts.reduce(
          (maxId, product) => Math.max(maxId, product.id),
          0
        ) + 1;

        const productToInsert: Product = {
          ...newProduct,
          id: nextId
        };

        // Insertar sin sobrescribir registros existentes
        await this.db.add<Product>(
          'products',
          productToInsert
        );

        // Actualizar inventario en memoria
        currentProducts = [
          ...currentProducts,
          productToInsert
        ];

        this.products.set(currentProducts);

        // Actualizar respaldo local
        this.saveLocalProducts(currentProducts);

        console.info(
          `Producto incorporado correctamente: ${productToInsert.name}`
        );
      }

      // Marcar como completada después de procesar los productos
      localStorage.setItem(
        this.cableCategoryMigrationKey,
        'completed'
      );

      console.info(
        'Migración Cat 6A y Cat 7 completada correctamente.'
      );

    } catch (error) {

      // No marcar la migración como completada si hubo un error
      console.error(
        'Error ejecutando migración Cat 6A y Cat 7:',
        error
      );
    }
  }

  // ==========================================
  // PERSISTENCIA LOCAL
  // ==========================================

  private saveLocalProducts(products: Product[]): void {

    try {

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(products)
      );

    } catch (error) {

      console.error(
        'Error guardando respaldo local:',
        error
      );
    }
  }

  // ==========================================
  // PERSISTENCIA EN INDEXEDDB
  // ==========================================

  private persistProducts(products: Product[]): Promise<void> {

    this.persistenceQueue = this.persistenceQueue.then(async () => {

      for (const product of products) {
        await this.db.put('products', product);
      }

      this.saveLocalProducts(products);

    }).catch(error => {

      console.error(
        'Error guardando productos en IndexedDB:',
        error
      );

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

    if (
      !this.initialized() ||
      !this.hasStock(productId, quantity)
    ) {
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

  // ==========================================
  // ACTUALIZACIÓN DE PRODUCTOS
  // ==========================================

  updateProduct(updatedProduct: Product): boolean {

    const currentProducts = this.products();

    const productExists = currentProducts.some(
      product => product.id === updatedProduct.id
    );

    if (!productExists) {
      console.error(
        `Producto con ID ${updatedProduct.id} no encontrado.`
      );

      return false;
    }

    const updatedProducts = currentProducts.map(product =>
      product.id === updatedProduct.id
        ? { ...product, ...updatedProduct }
        : product
    );

    this.products.set(updatedProducts);

    this.saveProducts();

    return true;
  }

}
