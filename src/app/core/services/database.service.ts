
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  // ==========================================
  // CONFIGURACIÓN DE INDEXEDDB
  // ==========================================

  private readonly DB_NAME = 'cablenet_db';
  private readonly DB_VERSION = 1;

  private dbPromise: Promise<IDBDatabase> | null = null;

  private readonly stores = [
    'products',
    'orders',
    'cart'
  ];

  // ==========================================
  // CONEXIÓN A INDEXEDDB
  // ==========================================

  private openDatabase(): Promise<IDBDatabase> {

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {

      const request = indexedDB.open(
        this.DB_NAME,
        this.DB_VERSION
      );

      // Crear estructura de la base de datos.
      request.onupgradeneeded = (event) => {

        const db = request.result;

        // Almacén de productos.
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', {
            keyPath: 'id'
          });
        }

        // Almacén de pedidos.
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', {
            keyPath: 'id'
          });
        }

        // Almacén del carrito.
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart');
        }

        console.info(
          `IndexedDB actualizada a versión ${event.newVersion}`
        );
      };

      request.onsuccess = () => {

        const db = request.result;

        // Cerrar conexión si cambia la versión.
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };

        resolve(db);
      };

      request.onerror = () => {

        this.dbPromise = null;

        reject(
          request.error ??
          new Error('No se pudo abrir IndexedDB')
        );
      };

      request.onblocked = () => {

        console.warn(
          'IndexedDB está bloqueada. Cierra otras pestañas de CableNet.'
        );
      };

    });

    return this.dbPromise;
  }

  // ==========================================
  // VALIDAR OBJECT STORE
  // ==========================================

  private validateStore(storeName: string): void {

    if (!this.stores.includes(storeName)) {
      throw new Error(
        `Object Store no permitido: ${storeName}`
      );
    }
  }

  // ==========================================
  // CONSULTAR TODOS LOS REGISTROS
  // ==========================================

  async getAll<T>(storeName: string): Promise<T[]> {

    this.validateStore(storeName);

    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {

      const transaction = db.transaction(
        storeName,
        'readonly'
      );

      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      let result: T[] = [];

      request.onsuccess = () => {
        result = request.result as T[];
      };

      transaction.oncomplete = () => {
        resolve(result);
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
          new Error(`Error consultando ${storeName}`)
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
          new Error(`Transacción abortada en ${storeName}`)
        );
      };
    });
  }

  // ==========================================
  // CONSULTAR UN REGISTRO
  // ==========================================

  async get<T>(
    storeName: string,
    key: IDBValidKey
  ): Promise<T | undefined> {

    this.validateStore(storeName);

    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {

      const transaction = db.transaction(
        storeName,
        'readonly'
      );

      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      let result: T | undefined;

      request.onsuccess = () => {
        result = request.result as T | undefined;
      };

      transaction.oncomplete = () => {
        resolve(result);
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
          new Error(`Error consultando registro en ${storeName}`)
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
          new Error(`Consulta abortada en ${storeName}`)
        );
      };
    });
  }

  // ==========================================
  // INSERTAR O ACTUALIZAR REGISTRO
  // ==========================================

  async put<T>(
    storeName: string,
    data: T,
    key?: IDBValidKey
  ): Promise<void> {

    this.validateStore(storeName);

    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {

      const transaction = db.transaction(
        storeName,
        'readwrite'
      );

      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
          new Error(`Error guardando datos en ${storeName}`)
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
          new Error(`Guardado abortado en ${storeName}`)
        );
      };

      try {

        if (key !== undefined) {
          store.put(data, key);
        } else {
          store.put(data);
        }

      } catch (error) {

        reject(error);
      }

    });
  }

  // ==========================================
  // INSERTAR REGISTRO SIN SOBRESCRIBIR
  // ==========================================

  async add<T>(
    storeName: string,
    data: T
  ): Promise<void> {

    this.validateStore(storeName);

    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {

      const transaction = db.transaction(
        storeName,
        'readwrite'
      );

      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
          new Error(`Error insertando datos en ${storeName}`)
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
          new Error(`Inserción abortada en ${storeName}`)
        );
      };

      try {

        // add() rechaza claves duplicadas.
        store.add(data);

      } catch (error) {

        reject(error);
      }

    });
  }

  // ==========================================
  // ELIMINAR REGISTRO
  // ==========================================

  async delete(
    storeName: string,
    key: IDBValidKey
  ): Promise<void> {

    this.validateStore(storeName);

    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {

      const transaction = db.transaction(
        storeName,
        'readwrite'
      );

      const store = transaction.objectStore(storeName);

      store.delete(key);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
          new Error(`Error eliminando registro de ${storeName}`)
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
          new Error(`Eliminación abortada en ${storeName}`)
        );
      };
    });
  }

  // ==========================================
  // ELIMINAR TODOS LOS REGISTROS
  // ==========================================

  async clear(storeName: string): Promise<void> {

    this.validateStore(storeName);

    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {

      const transaction = db.transaction(
        storeName,
        'readwrite'
      );

      const store = transaction.objectStore(storeName);

      store.clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
          new Error(`Error limpiando ${storeName}`)
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
          new Error(`Limpieza abortada en ${storeName}`)
        );
      };
    });
  }

  // ==========================================
  // VERIFICAR EXISTENCIA DE BASE DE DATOS
  // ==========================================

  async isAvailable(): Promise<boolean> {

    try {

      await this.openDatabase();

      return true;

    } catch (error) {

      console.error(
        'IndexedDB no está disponible:',
        error
      );

      return false;
    }
  }

}
