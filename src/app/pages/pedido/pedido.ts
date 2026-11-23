
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';

import { OrderCustomer, OrderItem, Order } from '../../core/models/order.model';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe,
    RouterLink
  ],
  templateUrl: './pedido.html',
  styleUrl: './pedido.css',
})
export class Pedido {

  // ==========================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================

  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);

  // ==========================================
  // DATOS DEL CARRITO
  // ==========================================

  items = this.cartService.items;
  total = this.cartService.total;
  itemCount = this.cartService.itemCount;

  // ==========================================
  // ESTADOS DEL PEDIDO
  // ==========================================

  submitted = signal(false);
  createdOrder = signal<Order | null>(null);

  // ==========================================
  // FORMULARIO DEL CLIENTE
  // ==========================================

  form = this.fb.group({
    nombreCompleto: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

    empresa: [''],

    nit: [''],

    telefono: [
      '',
      [
        Validators.required,
        Validators.minLength(7)
      ]
    ],

    correo: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    direccion: [
      '',
      [
        Validators.required,
        Validators.minLength(5)
      ]
    ],

    observaciones: [''],
  });

  // ==========================================
  // VALIDAR DISPONIBILIDAD DE STOCK
  // ==========================================

  private validateStock(): boolean {

    for (const item of this.items()) {

      const product = this.productService.getProductById(
        item.product.id
      );

      if (!product) {
        alert(
          `El producto "${item.product.name}" ya no está disponible.`
        );
        return false;
      }

      if (!product.active) {
        alert(
          `El producto "${product.name}" está inactivo.`
        );
        return false;
      }

      if (!this.productService.hasStock(
        product.id,
        item.quantity
      )) {
        alert(
          `Stock insuficiente para "${product.name}".\n` +
          `Stock disponible: ${product.stock}\n` +
          `Cantidad solicitada: ${item.quantity}`
        );
        return false;
      }
    }

    return true;
  }

  // ==========================================
  // REGISTRAR PEDIDO
  // ==========================================

  onSubmit(): void {

    // 1. Verificar que el carrito tenga productos

    if (this.items().length === 0) {
      alert(
        'El carrito está vacío. Agrega productos antes de continuar.'
      );
      return;
    }

    // 2. Validar formulario

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // 3. Evitar registrar el pedido dos veces

    if (this.createdOrder()) {
      return;
    }

    // 4. Validar stock de todos los productos
    // antes de descontar cualquier cantidad

    if (!this.validateStock()) {
      return;
    }

    // 5. Obtener datos del formulario

    const formData = this.form.getRawValue();

    // 6. Construir datos del cliente

    const customer: OrderCustomer = {
      nombreCompleto: formData.nombreCompleto ?? '',
      empresa: formData.empresa ?? '',
      nit: formData.nit ?? '',
      telefono: formData.telefono ?? '',
      correo: formData.correo ?? '',
      direccion: formData.direccion ?? '',
      observaciones: formData.observaciones ?? '',
    };

    // 7. Convertir productos del carrito
    // al formato de pedido

    const orderItems: OrderItem[] = this.items().map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    // 8. Calcular total del pedido

    const orderTotal = this.total();

    // 9. Registrar las unidades descontadas
    // para poder revertirlas si ocurre un error

    const decreasedItems: {
      productId: number;
      quantity: number;
    }[] = [];

    try {

      // 10. Descontar stock

      for (const item of this.items()) {

        const decreased = this.productService.decreaseStock(
          item.product.id,
          item.quantity
        );

        if (!decreased) {

          // Restaurar unidades previamente descontadas

          for (const decreasedItem of decreasedItems) {
            this.productService.increaseStock(
              decreasedItem.productId,
              decreasedItem.quantity
            );
          }

          alert(
            `No se pudo descontar el stock de "${item.product.name}". ` +
            'El pedido no fue registrado.'
          );

          return;
        }

        decreasedItems.push({
          productId: item.product.id,
          quantity: item.quantity
        });
      }

      // 11. Crear pedido

      const order = this.orderService.createOrder(
        customer,
        orderItems,
        orderTotal
      );

      // 12. Guardar pedido creado en el estado del componente

      this.createdOrder.set(order);

      // 13. Marcar envío exitoso

      this.submitted.set(true);

      // 14. Mostrar información en consola

      console.log(
        'PEDIDO REGISTRADO CORRECTAMENTE:',
        order
      );

    } catch (error) {

      // 15. Restaurar stock si ocurrió un error
      // durante el registro del pedido

      for (const decreasedItem of decreasedItems) {
        this.productService.increaseStock(
          decreasedItem.productId,
          decreasedItem.quantity
        );
      }

      console.error(
        'ERROR AL REGISTRAR EL PEDIDO:',
        error
      );

      alert(
        'Ocurrió un error al registrar el pedido. ' +
        'El inventario fue restaurado.'
      );
    }
  }
}
