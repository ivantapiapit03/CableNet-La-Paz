import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    NgClass,
    FormsModule,
    RouterLink
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial {

  private readonly orderService = inject(OrderService);

  orders = this.orderService.orders;

  searchText = signal('');
  selectedStatus = signal('TODOS');

  filteredOrders = computed(() => {
    const orders = this.orders();
    const search = this.searchText().trim().toLowerCase();
    const status = this.selectedStatus();

    return orders.filter(order => {
      const matchesSearch =
        order.id.toString().includes(search) ||
        order.customer.nombreCompleto.toLowerCase().includes(search) ||
        order.customer.empresa.toLowerCase().includes(search);

      const matchesStatus =
        status === 'TODOS' || order.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  totalOrders = computed(() => this.orders().length);

  pendingOrders = computed(() =>
    this.orders().filter(order => order.status === 'PENDIENTE').length
  );

  cancelledOrders = computed(() =>
    this.orders().filter(order => order.status === 'CANCELADO').length
  );

  onSearch(value: string): void {
    this.searchText.set(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
  }

  getOrderNumber(order: Order): string {
    return order.id.toString();
  }
}