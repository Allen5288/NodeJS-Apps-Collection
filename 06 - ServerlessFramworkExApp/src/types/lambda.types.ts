import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export interface EnhancedAPIGatewayEvent extends APIGatewayProxyEvent {
  user?: AuthenticatedUser;
  correlationId: string;
  requestTimestamp: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  cognitoId: string;
  roles: string[];
  permissions: string[];
}

export interface LambdaHandler<TEvent = any, TResult = any> {
  (event: TEvent, context: Context): Promise<TResult>;
}

export interface APIHandler extends LambdaHandler<EnhancedAPIGatewayEvent, APIGatewayProxyResult> {}

export interface QueueHandler<T = any> extends LambdaHandler<T, void> {}

export interface ScheduledHandler extends LambdaHandler<any, void> {}

export interface AuthorizerEvent {
  type: string;
  authorizationToken: string;
  methodArn: string;
}

export interface AuthorizerResult {
  principalId: string;
  policyDocument: PolicyDocument;
  context?: Record<string, any>;
}

export interface PolicyDocument {
  Version: string;
  Statement: PolicyStatement[];
}

export interface PolicyStatement {
  Action: string;
  Effect: 'Allow' | 'Deny';
  Resource: string;
}

export interface SQSMessage<T = any> {
  messageId: string;
  body: T;
  attributes: Record<string, string>;
  messageAttributes: Record<string, any>;
  receiptHandle: string;
}

export interface SNSMessage<T = any> {
  messageId: string;
  topicArn: string;
  subject?: string;
  message: T;
  timestamp: string;
}
