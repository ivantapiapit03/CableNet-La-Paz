import { Routes } from '@angular/router';

import { Inicio } from './pages/inicio/inicio';
import { Catalogo } from './pages/catalogo/catalogo';
import { DetalleProducto } from './pages/detalle-producto/detalle-producto';
import { Carrito } from './pages/carrito/carrito';
import { Pedido } from './pages/pedido/pedido';
import { Historial } from './pages/historial/historial';
import { DetallePedido } from './pages/detalle-pedido/detalle-pedido';

export const routes: Routes = [
  {
    path: '',
    component: Inicio
  },
  {
    path: 'catalogo',
    component: Catalogo
  },
  {
    path: 'producto/:id',
    component: DetalleProducto
  },
  {
    path: 'carrito',
    component: Carrito
  },
  {
    path: 'pedido',
    component: Pedido
  },
  {
    path: 'historial',
    component: Historial
  },
  {
    path: 'pedidos/:id',
    component: DetallePedido
  },
  {
    path: '**',
    redirectTo: ''
  }
];
