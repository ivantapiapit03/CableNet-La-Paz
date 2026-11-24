
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ProductoCard } from '../../components/producto-card/producto-card';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {

  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  // Texto ingresado en el buscador.
  searchTerm = signal('');

  // Categoría seleccionada.
  selectedCategory = signal('TODAS');

  // Productos activos del inventario.
  products = this.productService.getActiveProducts();

  // Categorías disponibles, obtenidas del inventario.
  categories = computed(() => {
    const availableCategories = this.products.map(
      product => product.category
    );

    return [...new Set(availableCategories)].sort();
  });

  // Combina búsqueda de texto y filtro por categoría.
  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.products.filter(product => {

      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);

      const matchesCategory =
        category === 'TODAS' ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('TODAS');
  }

  openProduct(id: number): void {
    void this.router.navigate(['/producto', id]);
  }
}
