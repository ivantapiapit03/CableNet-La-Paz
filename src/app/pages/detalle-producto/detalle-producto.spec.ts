import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleProducto } from './detalle-producto';
import { provideTestDependencies } from '../../testing/test-providers';

describe('DetalleProducto', () => {
  let component: DetalleProducto;
  let fixture: ComponentFixture<DetalleProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleProducto],
      providers: [...provideTestDependencies()],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleProducto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
