import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';
import { NotFoundError, AppError } from '@/utils/errors';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PaginationOptions {
  limit?: number;
  nextToken?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface QueryResult<T> {
  items: T[];
  nextToken?: string;
  totalCount?: number;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected readonly client: DynamoDBDocumentClient;
  protected readonly logger = createLogger();
  
  constructor(
    protected readonly tableName: string,
    region: string = config.aws.region
  ) {
    const dynamoClient = new DynamoDBClient({ region });
    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        removeUndefinedValues: true
      }
    });
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<T> {
    const now = new Date().toISOString();
    const entity: T = {
      ...item,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1
    } as T;

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: entity,
        ConditionExpression: 'attribute_not_exists(id)'
      });

      await this.client.send(command);
      
      this.logger.info('Entity created', {
        entityType: this.constructor.name,
        entityId: entity.id
      });

      return entity;
    } catch (error) {
      this.logger.error('Failed to create entity', error as Error, {
        entityType: this.constructor.name,
        item
      });
      throw new AppError('Failed to create entity', 500, 'CREATE_FAILED');
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id }
      });

      const result = await this.client.send(command);
      
      if (!result.Item) {
        return null;
      }

      return result.Item as T;
    } catch (error) {
      this.logger.error('Failed to find entity by ID', error as Error, {
        entityType: this.constructor.name,
        entityId: id
      });
      throw new AppError('Failed to retrieve entity', 500, 'FIND_FAILED');
    }
  }

  async findByIdOrThrow(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundError(this.constructor.name.replace('Repository', ''), id);
    }
    return entity;
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'version'>>): Promise<T> {
    const existing = await this.findByIdOrThrow(id);
    
    // Build update expression
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add updatedAt and increment version
    updateExpression.push('#updatedAt = :updatedAt');
    updateExpression.push('#version = #version + :one');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeNames['#version'] = 'version';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    expressionAttributeValues[':one'] = 1;
    expressionAttributeValues[':currentVersion'] = existing.version;

    // Add other updates
    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'version') {
        const attributeName = `#attr${index}`;
        const attributeValue = `:val${index}`;
        
        updateExpression.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    });

    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: '#version = :currentVersion',
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.client.send(command);
      
      this.logger.info('Entity updated', {
        entityType: this.constructor.name,
        entityId: id,
        updatedFields: Object.keys(updates)
      });

      return result.Attributes as T;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new AppError('Entity was modified by another process', 409, 'CONCURRENT_MODIFICATION');
      }
      
      this.logger.error('Failed to update entity', error, {
        entityType: this.constructor.name,
        entityId: id,
        updates
      });
      throw new AppError('Failed to update entity', 500, 'UPDATE_FAILED');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)'
      });

      await this.client.send(command);
      
      this.logger.info('Entity deleted', {
        entityType: this.constructor.name,
        entityId: id
      });
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(this.constructor.name.replace('Repository', ''), id);
      }
      
      this.logger.error('Failed to delete entity', error, {
        entityType: this.constructor.name,
        entityId: id
      });
      throw new AppError('Failed to delete entity', 500, 'DELETE_FAILED');
    }
  }

  async query(
    indexName: string | undefined,
    keyCondition: Record<string, any>,
    filterExpression?: string,
    options: PaginationOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      // Build key condition expression
      const keyConditionParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(keyCondition).forEach(([key, value], index) => {
        const attrName = `#k${index}`;
        const attrValue = `:v${index}`;
        keyConditionParts.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      });

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionParts.join(' AND '),
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: options.limit || 20,
        ExclusiveStartKey: options.nextToken ? JSON.parse(Buffer.from(options.nextToken, 'base64').toString()) : undefined,
        ScanIndexForward: options.sortOrder !== 'DESC'
      });

      const result = await this.client.send(command);
      
      return {
        items: (result.Items || []) as T[],
        nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
        totalCount: result.Count
      };
    } catch (error) {
      this.logger.error('Failed to query entities', error as Error, {
        entityType: this.constructor.name,
        indexName,
        keyCondition,
        options
      });
      throw new AppError('Failed to query entities', 500, 'QUERY_FAILED');
    }
  }

  async scan(
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    options: PaginationOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: options.limit || 20,
        ExclusiveStartKey: options.nextToken ? JSON.parse(Buffer.from(options.nextToken, 'base64').toString()) : undefined
      });

      const result = await this.client.send(command);
      
      return {
        items: (result.Items || []) as T[],
        nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
        totalCount: result.Count
      };
    } catch (error) {
      this.logger.error('Failed to scan entities', error as Error, {
        entityType: this.constructor.name,
        filterExpression,
        options
      });
      throw new AppError('Failed to scan entities', 500, 'SCAN_FAILED');
    }
  }

  async batchGet(ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];
    
    const batchSize = 100; // DynamoDB limit
    const results: T[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      
      try {
        const command = new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: batch.map(id => ({ id }))
            }
          }
        });

        const result = await this.client.send(command);
        const items = result.Responses?.[this.tableName] || [];
        results.push(...(items as T[]));
      } catch (error) {
        this.logger.error('Failed to batch get entities', error as Error, {
          entityType: this.constructor.name,
          batchIds: batch
        });
        throw new AppError('Failed to batch retrieve entities', 500, 'BATCH_GET_FAILED');
      }
    }

    return results;
  }

  async batchCreate(items: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]): Promise<T[]> {
    if (items.length === 0) return [];

    const now = new Date().toISOString();
    const entities: T[] = items.map(item => ({
      ...item,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1
    } as T));

    const batchSize = 25; // DynamoDB limit
    const results: T[] = [];

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      
      try {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch.map(item => ({
              PutRequest: { Item: item }
            }))
          }
        });

        await this.client.send(command);
        results.push(...batch);
      } catch (error) {
        this.logger.error('Failed to batch create entities', error as Error, {
          entityType: this.constructor.name,
          batchSize: batch.length
        });
        throw new AppError('Failed to batch create entities', 500, 'BATCH_CREATE_FAILED');
      }
    }

    this.logger.info('Entities batch created', {
      entityType: this.constructor.name,
      count: results.length
    });

    return results;
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected buildFilterExpression(
    filters: Record<string, any>,
    attributeNames: Record<string, string>,
    attributeValues: Record<string, any>
  ): string {
    const conditions: string[] = [];
    let nameIndex = 0;
    let valueIndex = 0;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const nameKey = `#n${nameIndex++}`;
        const valueKey = `:v${valueIndex++}`;
        
        attributeNames[nameKey] = key;
        attributeValues[valueKey] = value;
        
        if (Array.isArray(value)) {
          conditions.push(`${nameKey} IN (${value.map((_, i) => `:v${valueIndex + i}`).join(', ')})`);
          value.forEach((v, i) => {
            attributeValues[`:v${valueIndex + i}`] = v;
          });
          valueIndex += value.length;
        } else {
          conditions.push(`${nameKey} = ${valueKey}`);
        }
      }
    });

    return conditions.join(' AND ');
  }
}
