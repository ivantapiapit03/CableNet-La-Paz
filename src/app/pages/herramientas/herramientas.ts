
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';

type ToolId = 'cableado' | 'redes' | 'conversion' | 'diagnostico';

@Component({
  selector: 'app-herramientas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.css'
})
export class Herramientas {

  private readonly productService = inject(ProductService);

  // ==========================================
  // NAVEGACIÓN DE HERRAMIENTAS
  // ==========================================

  readonly selectedTool = signal<ToolId | null>(null);

  readonly tools = [
    {
      id: 'cableado' as ToolId,
      title: 'Comprobación y cálculo de cableado de red',
      icon: 'bi-rulers'
    },
    {
      id: 'redes' as ToolId,
      title: 'Análisis y configuración de redes IP',
      icon: 'bi-diagram-3'
    },
    {
      id: 'conversion' as ToolId,
      title: 'Conversión de unidades de cableado',
      icon: 'bi-arrow-left-right'
    },
    {
      id: 'diagnostico' as ToolId,
      title: 'Diagnóstico y conectividad de red',
      icon: 'bi-ethernet'
    }
  ];

  openTool(id: ToolId): void {
    this.selectedTool.set(id);
    this.clearMessage();
  }

  backToTools(): void {
    this.selectedTool.set(null);
    this.clearMessage();
  }

  // ==========================================
  // MENSAJES Y RESULTADOS
  // ==========================================

  readonly message = signal('');
  readonly messageType = signal<'success' | 'error' | 'info'>('info');

  private showMessage(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ): void {
    this.message.set(message);
    this.messageType.set(type);
  }

  private clearMessage(): void {
    this.message.set('');
  }

  async copyResult(text: string): Promise<void> {
    if (!text.trim()) {
      this.showMessage('No hay resultados para copiar.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.showMessage('Resultado copiado correctamente.', 'success');
    } catch {
      this.showMessage(
        'No se pudo copiar. Verifica los permisos del navegador.',
        'error'
      );
    }
  }

  // ==========================================
  // 1. COMPROBACIÓN Y CÁLCULO DE CABLEADO
  // ==========================================

  cableCategory = 'Cat 6';
  cablePoints = 10;
  cableDistance = 30;
  cableReserve = 10;

  readonly cableProduct = computed(() =>
    this.productService.getProductById(1)
  );

  readonly cableCalculation = signal<{
    points: number;
    distance: number;
    baseMeters: number;
    reserveMeters: number;
    totalMeters: number;
    boxes: number;
    coveredMeters: number;
    remainingMeters: number;
    estimatedCost: number;
    availableStock: number;
    enoughStock: boolean;
  } | null>(null);

  calculateCable(): void {
    const points = Number(this.cablePoints);
    const distance = Number(this.cableDistance);
    const reserve = Number(this.cableReserve);

    if (
      !Number.isInteger(points) ||
      points < 1 ||
      !Number.isFinite(distance) ||
      distance <= 0 ||
      !Number.isFinite(reserve) ||
      reserve < 0 ||
      reserve > 100
    ) {
      this.cableCalculation.set(null);
      this.showMessage(
        'Verifica los puntos, la distancia y el porcentaje de reserva.',
        'error'
      );
      return;
    }

    const product = this.cableProduct();

    if (
      !product ||
      !product.active ||
      !product.metersPerUnit ||
      product.metersPerUnit <= 0
    ) {
      this.showMessage(
        'No se encontró la presentación comercial del cable en el inventario.',
        'error'
      );
      return;
    }

    const baseMeters = points * distance;
    const reserveMeters = baseMeters * (reserve / 100);
    const totalMeters = baseMeters + reserveMeters;

    const boxes = Math.ceil(totalMeters / product.metersPerUnit);
    const coveredMeters = boxes * product.metersPerUnit;
    const remainingMeters = coveredMeters - totalMeters;

    const estimatedCost = boxes * product.price;
    const availableStock = product.stock;

    this.cableCalculation.set({
      points,
      distance,
      baseMeters,
      reserveMeters,
      totalMeters,
      boxes,
      coveredMeters,
      remainingMeters,
      estimatedCost,
      availableStock,
      enoughStock: availableStock >= boxes
    });

    this.showMessage(
      'Cálculo de cableado realizado correctamente.',
      'success'
    );
  }

  clearCable(): void {
    this.cableCategory = 'Cat 6';
    this.cablePoints = 10;
    this.cableDistance = 30;
    this.cableReserve = 10;
    this.cableCalculation.set(null);
    this.clearMessage();
  }

  // ==========================================
  // 2. ANÁLISIS Y CONFIGURACIÓN DE REDES IP
  // ==========================================

  ipAddress = '192.168.1.1';
  ipPrefix = 24;

  readonly ipCalculation = signal<{
    address: string;
    network: string;
    broadcast: string;
    mask: string;
    firstHost: string;
    lastHost: string;
    totalAddresses: number;
    usableHosts: number;
    wildcard: string;
  } | null>(null);

  private ipToNumber(ip: string): number | null {
    const parts = ip.trim().split('.');

    if (parts.length !== 4) return null;

    const octets = parts.map(Number);

    if (
      octets.some(
        octet =>
          !Number.isInteger(octet) ||
          octet < 0 ||
          octet > 255
      )
    ) {
      return null;
    }

    return (
      ((octets[0] << 24) |
        (octets[1] << 16) |
        (octets[2] << 8) |
        octets[3]) >>> 0
    );
  }

  private numberToIp(value: number): string {
    const n = value >>> 0;

    return [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255
    ].join('.');
  }

  calculateNetwork(): void {
    const ip = this.ipToNumber(this.ipAddress);
    const prefix = Number(this.ipPrefix);

    if (
      ip === null ||
      !Number.isInteger(prefix) ||
      prefix < 0 ||
      prefix > 32
    ) {
      this.ipCalculation.set(null);
      this.showMessage(
        'Introduce una dirección IPv4 válida y un prefijo entre 0 y 32.',
        'error'
      );
      return;
    }

    const mask = prefix === 0
      ? 0
      : (0xffffffff << (32 - prefix)) >>> 0;

    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;

    const totalAddresses = Math.pow(2, 32 - prefix);

    const usableHosts = prefix <= 30
      ? totalAddresses - 2
      : prefix === 31
        ? 2
        : 1;

    const firstHost = prefix <= 30
      ? network + 1
      : network;

    const lastHost = prefix <= 30
      ? broadcast - 1
      : broadcast;

    this.ipCalculation.set({
      address: this.ipAddress,
      network: this.numberToIp(network),
      broadcast: this.numberToIp(broadcast),
      mask: this.numberToIp(mask),
      firstHost: this.numberToIp(firstHost),
      lastHost: this.numberToIp(lastHost),
      totalAddresses,
      usableHosts,
      wildcard: this.numberToIp(wildcard)
    });

    this.showMessage(
      'Análisis de red IPv4 realizado correctamente.',
      'success'
    );
  }

  clearNetwork(): void {
    this.ipAddress = '192.168.1.1';
    this.ipPrefix = 24;
    this.ipCalculation.set(null);
    this.clearMessage();
  }

  // ==========================================
  // 3. CONVERSIÓN DE UNIDADES
  // ==========================================

  conversionValue = 100;

  conversionFrom = 'm';
  conversionTo = 'ft';

  readonly conversionUnits = [
    { value: 'mm', label: 'Milímetros (mm)', factor: 0.001 },
    { value: 'cm', label: 'Centímetros (cm)', factor: 0.01 },
    { value: 'm', label: 'Metros (m)', factor: 1 },
    { value: 'km', label: 'Kilómetros (km)', factor: 1000 },
    { value: 'in', label: 'Pulgadas (in)', factor: 0.0254 },
    { value: 'ft', label: 'Pies (ft)', factor: 0.3048 },
    { value: 'yd', label: 'Yardas (yd)', factor: 0.9144 }
  ];

  readonly conversionResult = signal<number | null>(null);

  convertUnits(): void {
    const value = Number(this.conversionValue);

    const from = this.conversionUnits.find(
      unit => unit.value === this.conversionFrom
    );

    const to = this.conversionUnits.find(
      unit => unit.value === this.conversionTo
    );

    if (
      !Number.isFinite(value) ||
      value < 0 ||
      !from ||
      !to
    ) {
      this.conversionResult.set(null);
      this.showMessage(
        'Introduce un valor válido y selecciona las unidades.',
        'error'
      );
      return;
    }

    const meters = value * from.factor;
    const result = meters / to.factor;

    this.conversionResult.set(result);

    this.showMessage(
      'Conversión realizada correctamente.',
      'success'
    );
  }

  clearConversion(): void {
    this.conversionValue = 100;
    this.conversionFrom = 'm';
    this.conversionTo = 'ft';
    this.conversionResult.set(null);
    this.clearMessage();
  }

  // ==========================================
  // 4. DIAGNÓSTICO Y CONECTIVIDAD
  // ==========================================

  diagnosticIp = '192.168.1.100';
  diagnosticGateway = '192.168.1.1';
  diagnosticDns = '8.8.8.8';

  readonly diagnosticResult = signal<{
    ipValid: boolean;
    gatewayValid: boolean;
    dnsValid: boolean;
    sameSubnet: boolean | null;
    commands: string[];
  } | null>(null);

  private isValidIp(value: string): boolean {
    return this.ipToNumber(value) !== null;
  }

  private sameSubnet(
    first: string,
    second: string
  ): boolean | null {
    const a = this.ipToNumber(first);
    const b = this.ipToNumber(second);

    if (a === null || b === null) return null;

    const mask = 0xffffff00;

    return ((a & mask) >>> 0) === ((b & mask) >>> 0);
  }

  diagnoseNetwork(): void {
    const ipValid = this.isValidIp(this.diagnosticIp);
    const gatewayValid = this.isValidIp(this.diagnosticGateway);
    const dnsValid = this.isValidIp(this.diagnosticDns);

    if (!ipValid || !gatewayValid || !dnsValid) {
      this.diagnosticResult.set(null);
      this.showMessage(
        'Verifica que las tres direcciones IPv4 sean válidas.',
        'error'
      );
      return;
    }

    const commands = [
      `ping ${this.diagnosticGateway}`,
      `ping ${this.diagnosticDns}`,
      'ipconfig /all',
      'tracert 8.8.8.8',
      'nslookup google.com'
    ];

    this.diagnosticResult.set({
      ipValid,
      gatewayValid,
      dnsValid,
      sameSubnet: this.sameSubnet(
        this.diagnosticIp,
        this.diagnosticGateway
      ),
      commands
    });

    this.showMessage(
      'Parámetros IP validados. Revisa los comandos sugeridos para ejecutar las pruebas reales.',
      'success'
    );
  }

  clearDiagnostic(): void {
    this.diagnosticIp = '192.168.1.100';
    this.diagnosticGateway = '192.168.1.1';
    this.diagnosticDns = '8.8.8.8';
    this.diagnosticResult.set(null);
    this.clearMessage();
  }

  // ==========================================
  // COPIAR RESULTADOS DE CADA HERRAMIENTA
  // ==========================================

  copyCableResult(): void {
    const result = this.cableCalculation();

    if (!result) return;

    const text = [
      'CABLENET - CÁLCULO DE CABLEADO',
      `Categoría: ${this.cableCategory}`,
      `Puntos: ${result.points}`,
      `Distancia por punto: ${result.distance} m`,
      `Metros base: ${result.baseMeters} m`,
      `Reserva: ${result.reserveMeters.toFixed(2)} m`,
      `Total necesario: ${result.totalMeters.toFixed(2)} m`,
      `Cajas necesarias: ${result.boxes}`,
      `Costo estimado: Bs ${result.estimatedCost.toFixed(2)}`,
      `Stock disponible: ${result.availableStock} cajas`,
      `Stock suficiente: ${result.enoughStock ? 'Sí' : 'No'}`
    ].join('\n');

    void this.copyResult(text);
  }

  copyNetworkResult(): void {
    const result = this.ipCalculation();

    if (!result) return;

    const text = [
      'CABLENET - ANÁLISIS IPv4',
      `IP: ${result.address}/${this.ipPrefix}`,
      `Red: ${result.network}`,
      `Máscara: ${result.mask}`,
      `Broadcast: ${result.broadcast}`,
      `Primer host: ${result.firstHost}`,
      `Último host: ${result.lastHost}`,
      `Total direcciones: ${result.totalAddresses}`,
      `Hosts utilizables: ${result.usableHosts}`,
      `Wildcard: ${result.wildcard}`
    ].join('\n');

    void this.copyResult(text);
  }

  copyConversionResult(): void {
    const result = this.conversionResult();

    if (result === null) return;

    void this.copyResult(
      `${this.conversionValue} ${this.conversionFrom} = ${result.toFixed(6)} ${this.conversionTo}`
    );
  }

  copyDiagnosticResult(): void {
    const result = this.diagnosticResult();

    if (!result) return;

    const text = [
      'CABLENET - DIAGNÓSTICO DE RED',
      `IP: ${this.diagnosticIp}`,
      `Gateway: ${this.diagnosticGateway}`,
      `DNS: ${this.diagnosticDns}`,
      `Gateway en misma subred /24: ${result.sameSubnet === null ? 'No determinado' : result.sameSubnet ? 'Sí' : 'No'}`,
      '',
      'COMANDOS SUGERIDOS:',
      ...result.commands
    ].join('\n');

    void this.copyResult(text);
  }
}
