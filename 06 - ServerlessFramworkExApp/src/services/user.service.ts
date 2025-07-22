import { BaseService } from './base.service';
import { UserRepository } from '@/repositories/user.repository';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserSearchCriteria, 
  PaginatedUsers,
  UserStatus 
} from '@/models/user.model';
import { validate, userSchemas } from '@/utils/validation';
import { AuditAction } from '@/models/audit.model';
import { config } from '@/utils/config';

export class UserService extends BaseService {
  private readonly userRepository: UserRepository;

  constructor(correlationId?: string, userId?: string) {
    super(correlationId, userId);
    this.userRepository = new UserRepository();
  }

  async createUser(request: CreateUserRequest, createdBy?: string): Promise<User> {
    this.logger.info('Creating user', { email: request.email });

    // Validate input
    const validatedRequest = validate(userSchemas.create, request);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(validatedRequest.email);
    await this.validateUniqueness(existingUser, 'email', validatedRequest.email, 'User');

    // Apply business rules
    this.validateBusinessRules([
      {
        condition: validatedRequest.email.length <= 100,
        message: 'Email address is too long',
        code: 'EMAIL_TOO_LONG'
      },
      {
        condition: !validatedRequest.email.includes('+'),
        message: 'Email aliases are not allowed',
        code: 'EMAIL_ALIAS_NOT_ALLOWED'
      }
    ]);

    // Set default preferences if not provided
    const defaultPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      language: 'en',
      timezone: 'UTC'
    };

    const userToCreate = {
      ...validatedRequest,
      status: UserStatus.PENDING_VERIFICATION,
      profile: {
        ...validatedRequest.profile,
        preferences: {
          ...defaultPreferences,
          ...validatedRequest.profile.preferences
        }
      }
    };

    // Create user
    const user = await this.withRetry(() => 
      this.userRepository.create(userToCreate)
    );

    // Create audit log
    await this.createAuditLog(
      'User',
      user.id,
      AuditAction.CREATE,
      this.buildChangeSet(null, this.sanitizeForAudit(user)),
      createdBy
    );

    this.logger.info('User created successfully', { 
      userId: user.id, 
      email: user.email 
    });

    return user;
  }

  async getUserById(id: string): Promise<User> {
    this.logger.info('Getting user by ID', { userId: id });

    const user = await this.userRepository.findById(id);
    return await this.validateExistence(user, 'User', id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    this.logger.info('Getting user by email', { email });

    return await this.userRepository.findByEmail(email);
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | null> {
    this.logger.info('Getting user by Cognito ID', { cognitoId });

    return await this.userRepository.findByCognitoId(cognitoId);
  }

  async listUsers(options: { 
    limit?: number; 
    lastKey?: string; 
    status?: UserStatus;
  } = {}): Promise<PaginatedUsers> {
    this.logger.info('Listing users', { options });

    const { limit = 20, lastKey, status } = options;

    // Validate pagination parameters
    this.validateBusinessRules([
      {
        condition: limit > 0 && limit <= 100,
        message: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT'
      }
    ]);

    const searchCriteria: UserSearchCriteria = {
      limit,
      lastKey,
      status
    };

    return await this.withRetry(() =>
      this.userRepository.findAll(searchCriteria)
    );
  }

  async updateUser(id: string, request: UpdateUserRequest, updatedBy?: string): Promise<User> {
    this.logger.info('Updating user', { userId: id });

    // Validate input
    const validatedRequest = validate(userSchemas.update, request);

    // Get existing user
    const existingUser = await this.getUserById(id);

    // Check email uniqueness if email is being updated
    if (validatedRequest.name && validatedRequest.name !== existingUser.name) {
      // Additional validation for name changes
      this.validateBusinessRules([
        {
          condition: validatedRequest.name.trim().length >= 2,
          message: 'Name must be at least 2 characters long',
          code: 'NAME_TOO_SHORT'
        }
      ]);
    }

    // Apply business rules for status changes
    if (validatedRequest.status && validatedRequest.status !== existingUser.status) {
      this.validateBusinessRules([
        {
          condition: this.isValidStatusTransition(existingUser.status, validatedRequest.status),
          message: `Invalid status transition from ${existingUser.status} to ${validatedRequest.status}`,
          code: 'INVALID_STATUS_TRANSITION'
        }
      ]);
    }

    // Update user
    const updatedUser = await this.withRetry(() =>
      this.userRepository.update(id, validatedRequest)
    );

    // Create audit log
    await this.createAuditLog(
      'User',
      id,
      AuditAction.UPDATE,
      this.buildChangeSet(this.sanitizeForAudit(existingUser), this.sanitizeForAudit(updatedUser)),
      updatedBy
    );

    this.logger.info('User updated successfully', { 
      userId: id,
      updatedFields: Object.keys(validatedRequest)
    });

    return updatedUser;
  }

  async updateUserStatus(id: string, status: UserStatus, updatedBy?: string): Promise<User> {
    this.logger.info('Updating user status', { userId: id, status });

    const existingUser = await this.getUserById(id);

    // Validate status transition
    this.validateBusinessRules([
      {
        condition: this.isValidStatusTransition(existingUser.status, status),
        message: `Invalid status transition from ${existingUser.status} to ${status}`,
        code: 'INVALID_STATUS_TRANSITION'
      }
    ]);

    const updatedUser = await this.withRetry(() =>
      this.userRepository.updateStatus(id, status)
    );

    // Create audit log
    await this.createAuditLog(
      'User',
      id,
      AuditAction.UPDATE,
      this.buildChangeSet(
        { status: existingUser.status },
        { status: status }
      ),
      updatedBy
    );

    this.logger.info('User status updated successfully', { userId: id, status });

    return updatedUser;
  }

  async deleteUser(id: string, deletedBy?: string): Promise<void> {
    this.logger.info('Deleting user', { userId: id });

    const existingUser = await this.getUserById(id);

    // Business rule: Only inactive or suspended users can be deleted
    this.validateBusinessRules([
      {
        condition: [UserStatus.INACTIVE, UserStatus.SUSPENDED].includes(existingUser.status),
        message: 'Only inactive or suspended users can be deleted',
        code: 'INVALID_DELETE_STATUS'
      }
    ]);

    await this.withRetry(() => this.userRepository.delete(id));

    // Create audit log
    await this.createAuditLog(
      'User',
      id,
      AuditAction.DELETE,
      this.buildChangeSet(this.sanitizeForAudit(existingUser), null),
      deletedBy
    );

    this.logger.info('User deleted successfully', { userId: id });
  }

  async searchUsers(criteria: UserSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<PaginatedUsers> {
    this.logger.info('Searching users', { criteria });

    // Apply pagination limits
    const limit = Math.min(options.limit || 20, 100);

    const result = await this.userRepository.searchUsers(criteria, {
      ...options,
      limit
    });

    return {
      users: result.items,
      nextToken: result.nextToken,
      totalCount: result.totalCount
    };
  }

  async getUsersByStatus(status: UserStatus, options: { limit?: number; nextToken?: string } = {}): Promise<PaginatedUsers> {
    this.logger.info('Getting users by status', { status });

    const limit = Math.min(options.limit || 20, 100);

    const result = await this.userRepository.findByStatus(status, {
      ...options,
      limit
    });

    return {
      users: result.items,
      nextToken: result.nextToken,
      totalCount: result.totalCount
    };
  }

  async activateUser(id: string, activatedBy?: string): Promise<User> {
    return await this.updateUserStatus(id, UserStatus.ACTIVE, activatedBy);
  }

  async deactivateUser(id: string, reason: string, deactivatedBy?: string): Promise<User> {
    this.logger.info('Deactivating user', { userId: id, reason });

    const updatedUser = await this.updateUserStatus(id, UserStatus.INACTIVE, deactivatedBy);

    // Additional audit log for deactivation reason
    await this.createAuditLog(
      'User',
      id,
      AuditAction.UPDATE,
      { reason, action: 'deactivated' },
      deactivatedBy
    );

    return updatedUser;
  }

  async suspendUser(id: string, reason: string, suspendedBy?: string): Promise<User> {
    this.logger.info('Suspending user', { userId: id, reason });

    const updatedUser = await this.updateUserStatus(id, UserStatus.SUSPENDED, suspendedBy);

    // Additional audit log for suspension reason
    await this.createAuditLog(
      'User',
      id,
      AuditAction.UPDATE,
      { reason, action: 'suspended' },
      suspendedBy
    );

    return updatedUser;
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
  }> {
    this.logger.info('Getting user statistics');

    const [
      activeUsers,
      inactiveUsers,
      pendingUsers,
      suspendedUsers
    ] = await Promise.all([
      this.userRepository.findByStatus(UserStatus.ACTIVE),
      this.userRepository.findByStatus(UserStatus.INACTIVE),
      this.userRepository.findByStatus(UserStatus.PENDING_VERIFICATION),
      this.userRepository.findByStatus(UserStatus.SUSPENDED)
    ]);

    const stats = {
      total: activeUsers.totalCount! + inactiveUsers.totalCount! + pendingUsers.totalCount! + suspendedUsers.totalCount!,
      active: activeUsers.totalCount || 0,
      inactive: inactiveUsers.totalCount || 0,
      pending: pendingUsers.totalCount || 0,
      suspended: suspendedUsers.totalCount || 0
    };

    this.logger.info('User statistics retrieved', stats);
    return stats;
  }

  async linkCognitoUser(userId: string, cognitoId: string, linkedBy?: string): Promise<User> {
    this.logger.info('Linking Cognito user', { userId, cognitoId });

    const existingUser = await this.getUserById(userId);

    // Check if Cognito ID is already linked to another user
    const existingCognitoUser = await this.userRepository.findByCognitoId(cognitoId);
    if (existingCognitoUser && existingCognitoUser.id !== userId) {
      const error = new Error('Cognito ID is already linked to another user');
      (error as any).code = 'COGNITO_ID_ALREADY_LINKED';
      (error as any).statusCode = 409;
      throw error;
    }

    const updatedUser = await this.userRepository.update(userId, { cognitoId });

    // Create audit log
    await this.createAuditLog(
      'User',
      userId,
      AuditAction.UPDATE,
      { action: 'cognito_linked', cognitoId },
      linkedBy
    );

    this.logger.info('Cognito user linked successfully', { userId, cognitoId });
    return updatedUser;
  }

  private isValidStatusTransition(currentStatus: UserStatus, newStatus: UserStatus): boolean {
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING_VERIFICATION]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
      [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
      [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.DELETED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.DELETED],
      [UserStatus.DELETED]: [] // No transitions from deleted
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
