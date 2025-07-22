export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  profile?: UserProfile;
  cognitoId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: Address;
  preferences: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

export interface CreateUserRequest {
  email: string;
  name: string;
  profile: Omit<UserProfile, 'preferences'> & {
    preferences?: Partial<UserPreferences>;
  };
}

export interface UpdateUserRequest {
  name?: string;
  profile?: Partial<UserProfile>;
  status?: UserStatus;
}

export interface UserSearchCriteria {
  email?: string;
  status?: UserStatus;
  nameContains?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  lastKey?: string;
}

export interface PaginatedUsers {
  users: User[];
  nextToken?: string;
  totalCount?: number;
}
