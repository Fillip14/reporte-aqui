export const BUCKET = 'reporte-aqui';
export const PROFILE_PREFIX = 'profile-images';

export const enum Table {
  AUTH = 'auth',
  USERS = 'users',
  PROFILES = 'profiles',
  REPORTS = 'reports',
}

export const enum Column {
  UUID = 'uuid',
  USER_ID = 'user_id',
  PROVIDER = 'provider',
  PROVIDER_UID = 'provider_uid',
  ID_REPORTS = 'id_reports',
  DOCUMENT = 'document',
}

export const enum AccountStatus {
  ACTIVE = 'active',
  PENDING = 'pending', // onboarding / verificação
  SUSPENDED = 'suspended', // moderação
  DELETED = 'deleted', // soft delete
}
