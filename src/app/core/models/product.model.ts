export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  image: string;
  active: boolean;

  // Información comercial
  unit?: string;
  presentation?: string;
  metersPerUnit?: number;
}