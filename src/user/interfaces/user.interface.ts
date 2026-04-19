import { UserRole } from '../../common/enums';

export interface User {
  id: string;
  login: string;
  password: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}
