import { handler } from '../../src/handlers/users.handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('Users Handler Integration', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: 'GET',
    path: '/api/users',
    headers: {
      'x-correlation-id': 'test-correlation-id'
    },
    queryStringParameters: null,
    pathParameters: null,
    body: null
  };

  beforeAll(() => {
    // Set up test environment variables
    process.env.USERS_TABLE = 'test-users-table';
    process.env.LOG_LEVEL = 'error';
  });

  it('should handle GET request for listing users', async () => {
    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBeDefined();
    expect(result.headers).toBeDefined();
    expect(result.body).toBeDefined();

    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('correlationId');
    expect(body).toHaveProperty('timestamp');
  });

  it('should handle GET request for single user', async () => {
    const eventWithId = {
      ...mockEvent,
      pathParameters: { id: 'user-123' }
    };

    const result = await handler(eventWithId as APIGatewayProxyEvent);

    expect(result.statusCode).toBeDefined();
    expect(result.headers).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('should handle POST request for creating user', async () => {
    const createEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      })
    };

    const result = await handler(createEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBeDefined();
    expect(result.headers).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('should handle invalid HTTP methods', async () => {
    const invalidEvent = {
      ...mockEvent,
      httpMethod: 'PATCH'
    };

    const result = await handler(invalidEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(405);
    
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Method not allowed');
  });
});
