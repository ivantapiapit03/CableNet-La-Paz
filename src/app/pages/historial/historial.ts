
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

  readonly orders = this.orderService.orders;

  readonly searchText = signal('');
  readonly selectedStatus = signal('TODOS');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly filteredOrders = computed(() => {
    const orders = this.orders();
    const search = this.searchText().trim().toLowerCase();
    const status = this.selectedStatus();
    const from = this.dateFrom();
    const to = this.dateTo();

    return orders.filter(order => {
      const matchesSearch =
        order.id.toString().includes(search) ||
        order.customer.nombreCompleto.toLowerCase().includes(search) ||
        (order.customer.empresa || '').toLowerCase().includes(search);

      const matchesStatus =
        status === 'TODOS' || order.status === status;

      const orderDate = this.getLocalDateKey(order.date);

      const matchesDateFrom =
        !from || (!!orderDate && orderDate >= from);

      const matchesDateTo =
        !to || (!!orderDate && orderDate <= to);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  });

  readonly totalOrders = computed(() => this.orders().length);

  readonly pendingOrders = computed(() =>
    this.orders().filter(order => order.status === 'PENDIENTE').length
  );

  readonly cancelledOrders = computed(() =>
    this.orders().filter(order => order.status === 'CANCELADO').length
  );

  onSearch(value: string): void {
    this.searchText.set(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedStatus.set('TODOS');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  getOrderNumber(order: Order): string {
    return order.id.toString();
  }

  private getLocalDateKey(value: Order['date']): string {
    const date = value instanceof Date
      ? value
      : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
