export const BUCKET = 'reporte-aqui';
export const PROFILE_PREFIX = 'profile-images';

export const enum Table {
  AUTH = 'auth',
  USERS = 'users',
  PROFILES = 'profiles',
  REPORTS = 'reports',
}

export const enum Column {
  ALL = '*',
  UUID = 'uuid',
  TYPE = 'type',
  STATUS = 'status',
  EMAIL = 'email',
  DOCUMENT = 'document',
  USER_ID = 'user_id',
  PROVIDER = 'provider',
  PROVIDER_UID = 'provider_uid',
  PASSWORD_HASH = 'password_hash',
  ID_REPORTS = 'id_reports',
}

export const enum AccountStatus {
  ACTIVE = 'active',
  PENDING = 'pending', // onboarding / verificação
  SUSPENDED = 'suspended', // moderação
  DELETED = 'deleted', // soft delete
}
