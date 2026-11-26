
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart';
import { provideTestDependencies } from '../../testing/test-providers';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...provideTestDependencies()] });
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with valid cart signals', () => {
    expect(service.items()).toBeDefined();
    expect(service.total()).toBe(0);
    expect(service.itemCount()).toBe(0);
    expect(service.productCount()).toBe(0);
  });
});
