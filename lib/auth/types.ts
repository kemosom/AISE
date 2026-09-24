export type UserRole = 'student' | 'lecturer' | 'admin' | 'STUDENT' | 'LECTURER' | 'ADMIN';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  studentId?: string;
  role: UserRole;
  issuedAt: number;
}

export interface AuthUserPublic {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  role: UserRole;
}
