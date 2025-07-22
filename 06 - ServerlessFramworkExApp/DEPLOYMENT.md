# Deployment Guide

## Quick Start

### Prerequisites
1. **Node.js 18+** installed
2. **AWS CLI** configured with appropriate permissions
3. **Serverless Framework** installed globally: `npm install -g serverless`

### Installation
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your specific values (especially JWT_SECRET)
```

### Local Development
```bash
# Start local development server
npm run dev

# The API will be available at http://localhost:3000
```

### Deployment

#### Development Environment
```bash
npm run deploy:dev
```

#### Staging Environment
```bash
npm run deploy:staging
```

#### Production Environment
```bash
npm run deploy:prod
```

## Environment-Specific Configuration

### Development
- Verbose logging enabled
- CORS allows all origins
- DynamoDB tables with `-dev` suffix
- Relaxed IAM permissions for development

### Staging
- Production-like configuration
- Restricted CORS origins
- Blue/green deployments
- Performance monitoring enabled

### Production
- Minimal logging
- Strict security policies
- Canary deployments
- Full monitoring and alerting

## AWS Resources Created

The deployment will create the following AWS resources:

### Compute
- Lambda functions for API, processors, and scheduled tasks
- API Gateway with custom authorizer

### Storage
- DynamoDB tables with GSIs and point-in-time recovery
- S3 bucket for file uploads

### Messaging
- SQS queues with dead letter queues
- SNS topics for event publishing

### Security
- Cognito User Pool for authentication
- IAM roles with least privilege access

### Monitoring
- CloudWatch logs and custom metrics
- CloudWatch alarms for canary deployments

## Post-Deployment Setup

### 1. Configure Cognito User Pool
```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Add user to admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@example.com \
  --group-name Administrators
```

### 2. Test API Endpoints
```bash
# Health check
curl https://your-api-gateway-url/health

# API documentation
curl https://your-api-gateway-url/docs
```

### 3. Monitor Deployments
- Check CloudWatch logs for any errors
- Verify DynamoDB tables are created
- Test SQS/SNS message flow

## Troubleshooting

### Common Issues

#### Deployment Fails
- Verify AWS credentials are configured
- Check IAM permissions
- Ensure unique bucket names

#### Functions Timeout
- Check CloudWatch logs for errors
- Verify DynamoDB table names match environment variables
- Check network connectivity

#### Authentication Issues
- Verify JWT_SECRET is configured
- Check Cognito User Pool configuration
- Validate authorizer function logs

### Useful Commands

```bash
# View logs
npm run logs:dev
npm run logs:prod

# Invoke function locally
npm run invoke:local

# Remove deployment
npm run remove:dev
npm run remove:staging
```

## Security Checklist

Before deploying to production:

- [ ] Change default JWT_SECRET
- [ ] Review IAM permissions
- [ ] Enable CloudTrail logging
- [ ] Configure VPC endpoints if needed
- [ ] Set up proper CORS origins
- [ ] Enable API Gateway logging
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts

## Cost Optimization

- Lambda functions use ARM64 architecture
- DynamoDB uses on-demand billing
- CloudWatch logs have retention policies
- S3 lifecycle policies for uploads bucket
