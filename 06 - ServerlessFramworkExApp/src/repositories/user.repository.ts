import { BaseRepository, QueryResult } from './base.repository';
import { User, UserSearchCriteria, UserStatus } from '@/models/user.model';
import { config } from '@/utils/config';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(config.aws.dynamodb.usersTable);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.query(
        'EmailIndex',
        { email }
      );
      
      return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
      this.logger.error('Failed to find user by email', error as Error, { email });
      throw error;
    }
  }

  async findByCognitoId(cognitoId: string): Promise<User | null> {
    try {
      const result = await this.scan(
        'cognitoId = :cognitoId',
        { ':cognitoId': cognitoId }
      );
      
      return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
      this.logger.error('Failed to find user by Cognito ID', error as Error, { cognitoId });
      throw error;
    }
  }

  async findByStatus(status: UserStatus, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<User>> {
    try {
      return await this.query(
        'StatusIndex',
        { status },
        undefined,
        options
      );
    } catch (error) {
      this.logger.error('Failed to find users by status', error as Error, { status });
      throw error;
    }
  }

  async findAll(criteria: UserSearchCriteria): Promise<{ users: User[]; nextToken?: string; totalCount?: number }> {
    try {
      const options = {
        limit: criteria.limit,
        nextToken: criteria.lastKey
      };

      let result: QueryResult<User>;

      if (criteria.status) {
        // Use status index for better performance
        result = await this.findByStatus(criteria.status, options);
      } else {
        // Scan all users
        let filterExpression = '';
        const attributeValues: Record<string, any> = {};
        const attributeNames: Record<string, string> = {};

        if (criteria.email) {
          filterExpression = '#email = :email';
          attributeNames['#email'] = 'email';
          attributeValues[':email'] = criteria.email;
        }

        if (criteria.nameContains) {
          if (filterExpression) filterExpression += ' AND ';
          filterExpression += 'contains(#name, :nameContains)';
          attributeNames['#name'] = 'name';
          attributeValues[':nameContains'] = criteria.nameContains;
        }

        if (criteria.createdAfter) {
          if (filterExpression) filterExpression += ' AND ';
          filterExpression += '#createdAt >= :createdAfter';
          attributeNames['#createdAt'] = 'createdAt';
          attributeValues[':createdAfter'] = criteria.createdAfter;
        }

        if (criteria.createdBefore) {
          if (filterExpression) filterExpression += ' AND ';
          filterExpression += '#createdAt <= :createdBefore';
          attributeNames['#createdAt'] = 'createdAt';
          attributeValues[':createdBefore'] = criteria.createdBefore;
        }

        result = await this.scan(
          filterExpression || undefined,
          Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
          options
        );
      }

      return {
        users: result.items,
        nextToken: result.nextToken,
        totalCount: result.totalCount
      };
    } catch (error) {
      this.logger.error('Failed to find all users', error as Error, { criteria });
      throw error;
    }
  }

  async searchUsers(criteria: UserSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<User>> {
    try {
      // If searching by email, use the email index
      if (criteria.email) {
        return await this.query(
          'EmailIndex',
          { email: criteria.email }
        );
      }

      // If searching by status, use the status index
      if (criteria.status) {
        return await this.query(
          'StatusIndex',
          { status: criteria.status },
          undefined,
          options
        );
      }

      // For other criteria, use scan with filters
      const filters: Record<string, any> = {};
      const attributeNames: Record<string, string> = {};
      const attributeValues: Record<string, any> = {};

      if (criteria.nameContains) {
        filters['name'] = criteria.nameContains;
      }

      if (criteria.createdAfter) {
        attributeNames['#createdAt'] = 'createdAt';
        attributeValues[':createdAfter'] = criteria.createdAfter;
      }

      if (criteria.createdBefore) {
        attributeNames['#createdAt'] = 'createdAt';
        attributeValues[':createdBefore'] = criteria.createdBefore;
      }

      let filterExpression = this.buildFilterExpression(filters, attributeNames, attributeValues);

      // Add date range filters
      if (criteria.createdAfter && criteria.createdBefore) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += '#createdAt BETWEEN :createdAfter AND :createdBefore';
      } else if (criteria.createdAfter) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += '#createdAt >= :createdAfter';
      } else if (criteria.createdBefore) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += '#createdAt <= :createdBefore';
      }

      // Add name contains filter
      if (criteria.nameContains) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'contains(#name, :nameContains)';
        attributeNames['#name'] = 'name';
        attributeValues[':nameContains'] = criteria.nameContains;
      }

      return await this.scan(
        filterExpression || undefined,
        Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
        options
      );
    } catch (error) {
      this.logger.error('Failed to search users', error as Error, { criteria });
      throw error;
    }
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return await this.update(id, { status });
  }

  async getActiveUsersCount(): Promise<number> {
    try {
      const result = await this.query(
        'StatusIndex',
        { status: UserStatus.ACTIVE }
      );
      
      return result.totalCount || 0;
    } catch (error) {
      this.logger.error('Failed to get active users count', error as Error);
      throw error;
    }
  }

  async findUsersCreatedBetween(startDate: string, endDate: string): Promise<User[]> {
    try {
      const result = await this.scan(
        '#createdAt BETWEEN :startDate AND :endDate',
        {
          ':startDate': startDate,
          ':endDate': endDate
        }
      );
      
      return result.items;
    } catch (error) {
      this.logger.error('Failed to find users created between dates', error as Error, { startDate, endDate });
      throw error;
    }
  }
}
