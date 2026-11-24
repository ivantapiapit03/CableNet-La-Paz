
import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.css',
})
export class ProductoCard {

  // Recibe los datos del producto desde el componente padre.
  product = input.required<Product>();

  // Emite el ID del producto cuando se solicita ver su detalle.
  verDetalle = output<number>();

  onVerDetalle(): void {
    this.verDetalle.emit(this.product().id);
  }
}
