
import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario {

  private readonly productService = inject(ProductService);

  // Estado de inicialización
  readonly initialized = this.productService.initialized;

  // Filtros
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('Todas');
  readonly selectedStatus = signal('Todos');

  // Productos reactivos
  readonly products = this.productService.getProducts();

  // Categorías disponibles
  readonly categories = computed(() => {
    const values = this.products().map(product => product.category);
    return ['Todas', ...new Set(values)];
  });

  // Productos filtrados
  readonly filteredProducts = computed(() => {

    const search = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();
    const status = this.selectedStatus();

    return this.products().filter(product => {

      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);

      const matchesCategory =
        category === 'Todas' || product.category === category;

      const matchesStatus =
        status === 'Todos' ||
        (status === 'Activos' && product.active) ||
        (status === 'Inactivos' && !product.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  });

  // Indicadores
  readonly totalProducts = computed(() => this.products().length);

  readonly activeProducts = computed(() =>
    this.products().filter(product => product.active).length
  );

  readonly inactiveProducts = computed(() =>
    this.products().filter(product => !product.active).length
  );

  readonly totalUnits = computed(() =>
    this.products().reduce((total, product) => total + product.stock, 0)
  );

  // Edición
  readonly editingProductId = signal<number | null>(null);
  readonly editedPrice = signal<number>(0);
  readonly editedStock = signal<number>(0);

  readonly message = signal('');
  readonly messageType = signal<'success' | 'error'>('success');

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
  }

  startEdit(product: Product): void {
    this.editingProductId.set(product.id);
    this.editedPrice.set(product.price);
    this.editedStock.set(product.stock);
    this.message.set('');
  }

  cancelEdit(): void {
    this.editingProductId.set(null);
  }

  saveProduct(product: Product): void {

    const price = this.editedPrice();
    const stock = this.editedStock();

    if (!Number.isFinite(price) || price <= 0) {
      this.showMessage('El precio debe ser mayor que cero.', 'error');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      this.showMessage('El stock debe ser un número entero igual o mayor a cero.', 'error');
      return;
    }

    const updatedProduct: Product = {
      ...product,
      price,
      stock
    };

    const saved = this.productService.updateProduct(updatedProduct);

    if (!saved) {
      this.showMessage('No se pudo actualizar el producto.', 'error');
      return;
    }

    this.editingProductId.set(null);
    this.showMessage(
      `Producto "${product.name}" actualizado correctamente.`,
      'success'
    );
  }

  toggleStatus(product: Product): void {

    const updatedProduct: Product = {
      ...product,
      active: !product.active
    };

    const saved = this.productService.updateProduct(updatedProduct);

    if (!saved) {
      this.showMessage('No se pudo cambiar el estado del producto.', 'error');
      return;
    }

    this.showMessage(
      `${product.name}: ${updatedProduct.active ? 'activado' : 'desactivado'}.`,
      'success'
    );
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('Todas');
    this.selectedStatus.set('Todos');
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message.set(message);
    this.messageType.set(type);
  }
}
