export type Category = {
  id: string;
  name: string;
  icon?: string;
};

export type Product = {
  name: string;
  description?: string;
  price: number;
  category: string;
  brand?: string;
  image?: string;
  rating?: number;
  stock?: number;
  featured?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};
