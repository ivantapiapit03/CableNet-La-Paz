import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly products = signal<Product[]>([
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
  ]);

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
}
