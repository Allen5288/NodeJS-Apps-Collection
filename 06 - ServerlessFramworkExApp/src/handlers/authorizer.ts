import { AuthorizerEvent, AuthorizerResult, PolicyDocument } from '@/types/lambda.types';
import { createLogger } from '@/utils/logger';
import { config } from '@/utils/config';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  sub: string;
  email: string;
  name: string;
  'cognito:groups'?: string[];
  exp: number;
  iat: number;
}

const logger = createLogger();

export const handler = async (event: AuthorizerEvent): Promise<AuthorizerResult> => {
  logger.info('Processing authorization request', {
    methodArn: event.methodArn,
    tokenType: event.type
  });

  try {
    // Extract token from authorization header
    const token = extractToken(event.authorizationToken);
    
    if (!token) {
      logger.warn('No token provided');
      throw new Error('Unauthorized');
    }

    // Verify and decode JWT token
    const decodedToken = await verifyToken(token);
    
    // Create policy document
    const policy = generatePolicy(decodedToken.sub, 'Allow', event.methodArn);
    
    // Add user context
    const context = {
      userId: decodedToken.sub,
      email: decodedToken.email,
      name: decodedToken.name,
      groups: JSON.stringify(decodedToken['cognito:groups'] || []),
      user: JSON.stringify({
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        roles: decodedToken['cognito:groups'] || [],
        permissions: getPermissionsFromGroups(decodedToken['cognito:groups'] || [])
      })
    };

    logger.info('Authorization successful', {
      userId: decodedToken.sub,
      email: decodedToken.email
    });

    return {
      principalId: decodedToken.sub,
      policyDocument: policy,
      context
    };

  } catch (error) {
    logger.error('Authorization failed', error as Error);
    
    // Return deny policy for any error
    const policy = generatePolicy('unauthorized', 'Deny', event.methodArn);
    
    return {
      principalId: 'unauthorized',
      policyDocument: policy
    };
  }
};

function extractToken(authorizationHeader: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  // Handle "Bearer <token>" format
  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

async function verifyToken(token: string): Promise<DecodedToken> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.app.jwtSecret) as DecodedToken;
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      throw new Error('Token expired');
    }

    return decoded;
  } catch (error) {
    logger.error('Token verification failed', error as Error);
    throw new Error('Invalid token');
  }
}

function generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string): PolicyDocument {
  const policy: PolicyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }
    ]
  };

  // For allow policies, we can be more permissive with resources
  if (effect === 'Allow') {
    policy.Statement[0].Resource = resource.split('/').slice(0, -1).join('/') + '/*';
  }

  return policy;
}

function getPermissionsFromGroups(groups: string[]): string[] {
  const permissionMap: Record<string, string[]> = {
    'Administrators': [
      'users:read', 'users:write', 'users:delete',
      'products:read', 'products:write', 'products:delete',
      'orders:read', 'orders:write', 'orders:delete',
      'audit:read'
    ],
    'Managers': [
      'users:read', 'users:write',
      'products:read', 'products:write',
      'orders:read', 'orders:write'
    ],
    'Staff': [
      'products:read',
      'orders:read', 'orders:write'
    ],
    'Customers': [
      'products:read',
      'orders:read'
    ]
  };

  const permissions = new Set<string>();
  
  groups.forEach(group => {
    const groupPermissions = permissionMap[group] || [];
    groupPermissions.forEach(permission => permissions.add(permission));
  });

  return Array.from(permissions);
}
