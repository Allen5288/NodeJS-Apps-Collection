import { BaseRepository, QueryResult } from './base.repository';
import { Product, ProductSearchCriteria, ProductStatus } from '@/models/product.model';
import { config } from '@/utils/config';

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(config.aws.dynamodb.productsTable);
  }

  async findBySku(sku: string): Promise<Product | null> {
    try {
      const result = await this.scan(
        'sku = :sku',
        { ':sku': sku }
      );
      
      return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
      this.logger.error('Failed to find product by SKU', error as Error, { sku });
      throw error;
    }
  }

  async findByCategory(category: string, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<Product>> {
    try {
      return await this.query(
        'CategoryIndex',
        { category },
        undefined,
        options
      );
    } catch (error) {
      this.logger.error('Failed to find products by category', error as Error, { category });
      throw error;
    }
  }

  async findByStatus(status: ProductStatus, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<Product>> {
    try {
      return await this.query(
        'StatusIndex',
        { status },
        undefined,
        options
      );
    } catch (error) {
      this.logger.error('Failed to find products by status', error as Error, { status });
      throw error;
    }
  }

  async searchProducts(criteria: ProductSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<Product>> {
    try {
      // If searching by category, use the category index
      if (criteria.category && !Object.keys(criteria).some(key => key !== 'category')) {
        return await this.query(
          'CategoryIndex',
          { category: criteria.category },
          undefined,
          options
        );
      }

      // If searching by status, use the status index
      if (criteria.status && !Object.keys(criteria).some(key => key !== 'status')) {
        return await this.query(
          'StatusIndex',
          { status: criteria.status },
          undefined,
          options
        );
      }

      // For complex criteria, use scan with filters
      const attributeNames: Record<string, string> = {};
      const attributeValues: Record<string, any> = {};
      const filterExpressions: string[] = [];

      if (criteria.category) {
        filterExpressions.push('category = :category');
        attributeValues[':category'] = criteria.category;
      }

      if (criteria.status) {
        filterExpressions.push('#status = :status');
        attributeNames['#status'] = 'status';
        attributeValues[':status'] = criteria.status;
      }

      if (criteria.nameContains) {
        filterExpressions.push('contains(#name, :nameContains)');
        attributeNames['#name'] = 'name';
        attributeValues[':nameContains'] = criteria.nameContains;
      }

      if (criteria.priceMin !== undefined) {
        filterExpressions.push('price >= :priceMin');
        attributeValues[':priceMin'] = criteria.priceMin;
      }

      if (criteria.priceMax !== undefined) {
        filterExpressions.push('price <= :priceMax');
        attributeValues[':priceMax'] = criteria.priceMax;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const tagConditions = criteria.tags.map((tag, index) => {
          const tagKey = `:tag${index}`;
          attributeValues[tagKey] = tag;
          return `contains(tags, ${tagKey})`;
        });
        filterExpressions.push(`(${tagConditions.join(' OR ')})`);
      }

      if (criteria.inStock) {
        filterExpressions.push('inventory.available > :zero');
        attributeValues[':zero'] = 0;
      }

      const filterExpression = filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined;

      return await this.scan(
        filterExpression,
        Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
        options
      );
    } catch (error) {
      this.logger.error('Failed to search products', error as Error, { criteria });
      throw error;
    }
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    return await this.update(id, { status });
  }

  async updateInventory(id: string, quantity: number, reserved: number): Promise<Product> {
    const existing = await this.findByIdOrThrow(id);
    const available = quantity - reserved;
    
    return await this.update(id, {
      inventory: {
        ...existing.inventory,
        quantity,
        reserved,
        available
      }
    });
  }

  async findLowStockProducts(): Promise<Product[]> {
    try {
      const result = await this.scan(
        'inventory.available <= inventory.lowStockThreshold AND inventory.trackInventory = :true AND #status = :active',
        {
          ':true': true,
          ':active': ProductStatus.ACTIVE
        }
      );
      
      return result.items;
    } catch (error) {
      this.logger.error('Failed to find low stock products', error as Error);
      throw error;
    }
  }

  async findProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    try {
      const result = await this.scan(
        'price BETWEEN :minPrice AND :maxPrice AND #status = :active',
        {
          ':minPrice': minPrice,
          ':maxPrice': maxPrice,
          ':active': ProductStatus.ACTIVE
        }
      );
      
      return result.items;
    } catch (error) {
      this.logger.error('Failed to find products by price range', error as Error, { minPrice, maxPrice });
      throw error;
    }
  }

  async getProductsByCategories(categories: string[]): Promise<QueryResult<Product>> {
    try {
      if (categories.length === 0) {
        return { items: [], totalCount: 0 };
      }

      // For multiple categories, we need to query each one separately and combine results
      const allProducts: Product[] = [];
      
      for (const category of categories) {
        const result = await this.query(
          'CategoryIndex',
          { category }
        );
        allProducts.push(...result.items);
      }

      // Remove duplicates by ID
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );

      return {
        items: uniqueProducts,
        totalCount: uniqueProducts.length
      };
    } catch (error) {
      this.logger.error('Failed to get products by categories', error as Error, { categories });
      throw error;
    }
  }

  async incrementReservedQuantity(id: string, quantity: number): Promise<Product> {
    const product = await this.findByIdOrThrow(id);
    const newReserved = product.inventory.reserved + quantity;
    const newAvailable = product.inventory.quantity - newReserved;

    if (newAvailable < 0) {
      throw new Error('Insufficient inventory available');
    }

    return await this.updateInventory(id, product.inventory.quantity, newReserved);
  }

  async decrementReservedQuantity(id: string, quantity: number): Promise<Product> {
    const product = await this.findByIdOrThrow(id);
    const newReserved = Math.max(0, product.inventory.reserved - quantity);
    
    return await this.updateInventory(id, product.inventory.quantity, newReserved);
  }

  async getProductStatsByCategory(): Promise<Record<string, { total: number; active: number; lowStock: number }>> {
    try {
      const result = await this.scan();
      const stats: Record<string, { total: number; active: number; lowStock: number }> = {};

      result.items.forEach(product => {
        if (!stats[product.category]) {
          stats[product.category] = { total: 0, active: 0, lowStock: 0 };
        }

        stats[product.category].total++;
        
        if (product.status === ProductStatus.ACTIVE) {
          stats[product.category].active++;
        }

        if (product.inventory.trackInventory && 
            product.inventory.available <= product.inventory.lowStockThreshold) {
          stats[product.category].lowStock++;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get product stats by category', error as Error);
      throw error;
    }
  }
}
