import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Historial } from './historial';
import { provideTestDependencies } from '../../testing/test-providers';

describe('Historial', () => {
  let component: Historial;
  let fixture: ComponentFixture<Historial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Historial],
      providers: [...provideTestDependencies()],
    }).compileComponents();

    fixture = TestBed.createComponent(Historial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
