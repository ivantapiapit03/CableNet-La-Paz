
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink
  ],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css'
})
export class DetallePedido {

  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  // ID del pedido obtenido desde la URL
  orderId = Number(this.route.snapshot.paramMap.get('id'));

  // Pedido seleccionado
  order = computed<Order | undefined>(() =>
    this.orderService.getOrderById(this.orderId)
  );

  // Verificar si existe el pedido
  isOrderFound = computed(() =>
    this.order() !== undefined
  );

  // Mensaje de resultado de la cancelación
  cancelMessage = signal('');

  // Cancelar pedido
  cancelOrder(): void {

    const currentOrder = this.order();

    // Verificar que el pedido exista
    if (!currentOrder) {
      this.cancelMessage.set('No se encontró el pedido.');
      return;
    }

    // Evitar cancelar pedidos que ya fueron cancelados
    if (currentOrder.status !== 'PENDIENTE') {
      this.cancelMessage.set('Este pedido ya no puede ser cancelado.');
      return;
    }

    // Solicitar confirmación al usuario
    const confirmed = confirm(
      `¿Estás seguro de cancelar el pedido #${currentOrder.id}?`
    );

    if (!confirmed) {
      return;
    }

    // Ejecutar cancelación desde el servicio
    const cancelled = this.orderService.cancelOrder(currentOrder.id);

    if (cancelled) {
      this.cancelMessage.set(
        `El pedido #${currentOrder.id} fue cancelado correctamente.`
      );
    } else {
      this.cancelMessage.set(
        'No fue posible cancelar el pedido. Verifica su estado.'
      );
    }

  }

}
