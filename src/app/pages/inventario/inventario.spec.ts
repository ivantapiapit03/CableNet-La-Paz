import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inventario } from './inventario';
import { provideTestDependencies, resetProductMock } from '../../testing/test-providers';

describe('Inventario', () => {
  let component: Inventario;
  let fixture: ComponentFixture<Inventario>;

  beforeEach(async () => {
    resetProductMock();
    await TestBed.configureTestingModule({
      imports: [Inventario],
      providers: [...provideTestDependencies()]
    }).compileComponents();
    fixture = TestBed.createComponent(Inventario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter products by name', () => {
    component.onSearch('Cable');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].name).toBe('Cable Cat 6');
  });

  it('should filter products by category', () => {
    component.onCategoryChange('Conectividad');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].name).toBe('Patch Panel');
  });

  it('should filter inactive products', () => {
    component.onStatusChange('Inactivos');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].active).toBe(false);
  });

  it('should combine search and category filters', () => {
    component.onSearch('Cable');
    component.onCategoryChange('Conectividad');
    expect(component.filteredProducts().length).toBe(0);
  });

  it('should calculate inventory indicators', () => {
    expect(component.totalProducts()).toBe(2);
    expect(component.activeProducts()).toBe(1);
    expect(component.inactiveProducts()).toBe(1);
    expect(component.totalUnits()).toBe(15);
  });

  it('should reject an invalid price', () => {
    const product = component.products()[0];
    component.startEdit(product);
    component.editedPrice.set(0);
    component.saveProduct(product);
    expect(component.messageType()).toBe('error');
    expect(component.products()[0].price).toBe(100);
  });

  it('should reject a non-integer stock value', () => {
    const product = component.products()[0];
    component.startEdit(product);
    component.editedStock.set(1.5);
    component.saveProduct(product);
    expect(component.messageType()).toBe('error');
    expect(component.products()[0].stock).toBe(10);
  });

  it('should save valid price and stock changes', () => {
    const product = component.products()[0];
    component.startEdit(product);
    component.editedPrice.set(150);
    component.editedStock.set(12);
    component.saveProduct(product);
    expect(component.products()[0].price).toBe(150);
    expect(component.products()[0].stock).toBe(12);
    expect(component.editingProductId()).toBeNull();
    expect(component.messageType()).toBe('success');
  });

  it('should toggle product active status', () => {
    const product = component.products()[0];
    component.toggleStatus(product);
    expect(component.products()[0].active).toBe(false);
    expect(component.messageType()).toBe('success');
  });
});

