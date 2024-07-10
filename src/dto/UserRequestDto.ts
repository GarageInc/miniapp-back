import { User } from 'src/user/user.schema';

export interface RequestInterface {
  user: User;
  header: Record<string, string>;
}
