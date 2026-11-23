import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {

  private readonly productService = inject(ProductService);

  searchTerm = signal('');

  products = this.productService.getActiveProducts();

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.products;
    }

    return this.products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.brand.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  });

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }
}