export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  sku: string;
  status: ProductStatus;
  inventory: ProductInventory;
  metadata: ProductMetadata;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProductInventory {
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface ProductMetadata {
  weight?: number;
  dimensions?: ProductDimensions;
  manufacturer?: string;
  warranty?: string;
  specifications: Record<string, string>;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  DRAFT = 'DRAFT'
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  sku: string;
  inventory: Omit<ProductInventory, 'available' | 'reserved'>;
  metadata?: Partial<ProductMetadata>;
  images?: string[];
  tags?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  status?: ProductStatus;
  inventory?: Partial<ProductInventory>;
  metadata?: Partial<ProductMetadata>;
  images?: string[];
  tags?: string[];
}

export interface ProductSearchCriteria {
  category?: string;
  status?: ProductStatus;
  nameContains?: string;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  inStock?: boolean;
  search?: string;
  lastKey?: string;
}

export interface PaginatedProducts {
  products: Product[];
  nextToken?: string;
  totalCount?: number;
}
