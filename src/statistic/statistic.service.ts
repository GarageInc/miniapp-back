import { Injectable } from '@nestjs/common';
import { User } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class StatisticService {
  constructor(private readonly userService: UserService) {}

  async getTopReferrers() {
    const users: User[] = await this.userService.getTopReferrers();

    return users.map((user) => ({
      id: user._id,
      username: user.username,
      photoUrl: user.photoUrl,
      first_name: user.first_name,
      last_name: user.last_name,
      invitedUsersAmount: user.invitedUsersAmount,
      level: user.level,
    }));
  }

  async getTopLevels() {
    const users: User[] = await this.userService.getTopLevelUsers();

    return users.map((user) => ({
      id: user._id,
      username: user.username,
      photoUrl: user.photoUrl,
      first_name: user.first_name,
      last_name: user.last_name,
      level: user.level,
    }));
  }

  async getTopCrafedPairsUsers() {
    const users: {
      user: User[];
      craftedAmount: number;
    }[] = await this.userService.getTopCraftedPairs();

    //return users;
    return users.map(({ user: users, craftedAmount }) => {
      const user = users[0];
      return {
        id: user._id,
        username: user.username,
        photoUrl: user.photoUrl,
        first_name: user.first_name,
        last_name: user.last_name,
        craftedAmount: craftedAmount,
        level: user.level,
      };
    });
  }
}
