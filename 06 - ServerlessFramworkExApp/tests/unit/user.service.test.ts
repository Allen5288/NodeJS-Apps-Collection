import { UserService } from '../../src/services/user.service';
import { CreateUserRequest } from '../../src/models/user.model';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService('test-correlation-id', 'test-user-id');
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createRequest: CreateUserRequest = {
        email: 'test@example.com',
        name: 'Test User',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      // Mock the repository method
      jest.spyOn(userService['userRepository'], 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userService['userRepository'], 'create').mockResolvedValue({
        id: 'user-123',
        email: createRequest.email,
        name: createRequest.name,
        status: 'ACTIVE' as any,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: false,
            language: 'en',
            timezone: 'UTC'
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      });

      const result = await userService.createUser(createRequest);

      expect(result).toBeDefined();
      expect(result.email).toBe(createRequest.email);
      expect(result.name).toBe(createRequest.name);
    });

    it('should throw error if user already exists', async () => {
      const createRequest: CreateUserRequest = {
        email: 'existing@example.com',
        name: 'Existing User',
        profile: {
          firstName: 'Existing',
          lastName: 'User'
        }
      };

      // Mock existing user
      jest.spyOn(userService['userRepository'], 'findByEmail').mockResolvedValue({
        id: 'existing-user',
        email: createRequest.email,
        name: createRequest.name,
        status: 'ACTIVE' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      });

      await expect(userService.createUser(createRequest)).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        status: 'ACTIVE' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      jest.spyOn(userService['userRepository'], 'findById').mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      const userId = 'non-existent';

      jest.spyOn(userService['userRepository'], 'findById').mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow('User with identifier \'non-existent\' not found');
    });
  });
});
