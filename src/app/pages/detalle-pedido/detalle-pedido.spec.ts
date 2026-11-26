import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallePedido } from './detalle-pedido';
import { provideTestDependencies } from '../../testing/test-providers';

describe('DetallePedido', () => {
  let component: DetallePedido;
  let fixture: ComponentFixture<DetallePedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePedido],
      providers: [...provideTestDependencies()],
    }).compileComponents();

    fixture = TestBed.createComponent(DetallePedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
