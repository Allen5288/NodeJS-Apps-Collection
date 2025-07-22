import { BaseService } from './base.service';
import { ProductRepository } from '@/repositories/product.repository';
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductSearchCriteria, 
  PaginatedProducts,
  ProductStatus 
} from '@/models/product.model';
import { AuditAction } from '@/models/audit.model';

export class ProductService extends BaseService {
  private readonly productRepository: ProductRepository;

  constructor(correlationId?: string, userId?: string) {
    super(correlationId, userId);
    this.productRepository = new ProductRepository();
  }

  async createProduct(request: CreateProductRequest, createdBy?: string): Promise<Product> {
    this.logger.info('Creating product', { name: request.name, category: request.category });

    // Validate business rules
    this.validateBusinessRules([
      {
        condition: request.price > 0,
        message: 'Product price must be greater than zero',
        code: 'INVALID_PRICE'
      },
      {
        condition: request.inventory.quantity >= 0,
        message: 'Inventory quantity cannot be negative',
        code: 'INVALID_INVENTORY'
      }
    ]);

    // Check SKU uniqueness
    const existingSKU = await this.productRepository.findBySku(request.sku);
    await this.validateUniqueness(existingSKU, 'SKU', request.sku, 'Product');

    const productToCreate = {
      ...request,
      status: ProductStatus.DRAFT,
      images: request.images || [],
      tags: request.tags || [],
      metadata: request.metadata ? {
        ...request.metadata,
        specifications: request.metadata.specifications || {}
      } : {
        specifications: {}
      },
      inventory: {
        ...request.inventory,
        reserved: 0,
        available: request.inventory.quantity
      }
    };

    const product = await this.withRetry(() => 
      this.productRepository.create(productToCreate)
    );

    await this.createAuditLog(
      'Product',
      product.id,
      AuditAction.CREATE,
      this.buildChangeSet(null, this.sanitizeForAudit(product)),
      createdBy
    );

    this.logger.info('Product created successfully', { 
      productId: product.id, 
      name: product.name 
    });

    return product;
  }

  async getProductById(id: string): Promise<Product> {
    this.logger.info('Getting product by ID', { productId: id });
    
    const product = await this.productRepository.findById(id);
    return await this.validateExistence(product, 'Product', id);
  }

  async updateProduct(id: string, request: UpdateProductRequest, updatedBy?: string): Promise<Product> {
    this.logger.info('Updating product', { productId: id });

    const existingProduct = await this.getProductById(id);
    
    // Merge fields properly to ensure required fields are present
    const updateData = {
      ...request,
      metadata: request.metadata ? {
        ...existingProduct.metadata,
        ...request.metadata,
        specifications: {
          ...existingProduct.metadata.specifications,
          ...(request.metadata.specifications || {})
        }
      } : existingProduct.metadata,
      inventory: request.inventory ? {
        ...existingProduct.inventory,
        ...request.inventory
      } : existingProduct.inventory
    };
    
    const updatedProduct = await this.withRetry(() =>
      this.productRepository.update(id, updateData)
    );

    await this.createAuditLog(
      'Product',
      id,
      AuditAction.UPDATE,
      this.buildChangeSet(this.sanitizeForAudit(existingProduct), this.sanitizeForAudit(updatedProduct)),
      updatedBy
    );

    return updatedProduct;
  }

  async deleteProduct(id: string, deletedBy?: string): Promise<void> {
    this.logger.info('Deleting product', { productId: id });

    const existingProduct = await this.getProductById(id);
    
    // Instead of actual deletion, set status to discontinued
    await this.updateProduct(id, { status: ProductStatus.DISCONTINUED }, deletedBy);

    this.logger.info('Product deleted successfully', { productId: id });
  }

  async searchProducts(criteria: ProductSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<PaginatedProducts> {
    this.logger.info('Searching products', { criteria });

    const limit = Math.min(options.limit || 20, 100);

    const result = await this.productRepository.searchProducts(criteria, {
      ...options,
      limit
    });

    return {
      products: result.items,
      nextToken: result.nextToken,
      totalCount: result.totalCount
    };
  }
}
