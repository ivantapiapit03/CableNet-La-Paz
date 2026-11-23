import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto {

  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  product = signal<Product | undefined>(undefined);

  quantity = signal(1);

  message = signal('');
  messageType = signal<'success' | 'error' | ''>('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.product.set(this.productService.getProductById(id));
  }

  increaseQuantity(): void {
    const currentProduct = this.product();

    if (currentProduct && this.quantity() < currentProduct.stock) {
      this.quantity.update(value => value + 1);
      this.message.set('');
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(value => value - 1);
      this.message.set('');
    }
  }

  addToCart(): void {
    const currentProduct = this.product();

    if (!currentProduct) {
      this.message.set('No se encontró el producto.');
      this.messageType.set('error');
      return;
    }

    const added = this.cartService.addProduct(
      currentProduct,
      this.quantity()
    );

    if (added) {
      this.message.set(
        `${currentProduct.name} agregado al carrito correctamente.`
      );
      this.messageType.set('success');
    } else {
      this.message.set(
        'No se pudo agregar el producto. Verifica la cantidad y el stock disponible.'
      );
      this.messageType.set('error');
    }
  }
}