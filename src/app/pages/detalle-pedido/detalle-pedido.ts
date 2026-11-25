
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

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

  // Escuchar cambios del parámetro ID de la URL
  private readonly routeParams = toSignal(
    this.route.paramMap,
    { initialValue: this.route.snapshot.paramMap }
  );

  // Obtener y validar el identificador
  readonly orderId = computed(() => {
    const id = Number(this.routeParams().get('id'));

    return Number.isSafeInteger(id) && id > 0
      ? id
      : null;
  });

  // Recuperar el pedido seleccionado
  readonly order = computed<Order | undefined>(() => {
    const id = this.orderId();

    if (id === null) {
      return undefined;
    }

    return this.orderService.getOrderById(id);
  });

  // Comprobar existencia
  readonly isOrderFound = computed(() =>
    this.order() !== undefined
  );

  // Mensaje de cancelación
  readonly cancelMessage = signal('');

  // Cancelar pedido
  cancelOrder(): void {

    const currentOrder = this.order();

    if (!currentOrder) {
      this.cancelMessage.set('No se encontró el pedido.');
      return;
    }

    if (currentOrder.status !== 'PENDIENTE') {
      this.cancelMessage.set(
        'Este pedido ya no puede ser cancelado.'
      );
      return;
    }

    const confirmed = confirm(
      `¿Estás seguro de cancelar el pedido #${currentOrder.id}?`
    );

    if (!confirmed) {
      return;
    }

    const cancelled = this.orderService.cancelOrder(
      currentOrder.id
    );

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
