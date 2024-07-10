import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { UserNotifications } from './user-notifications.schema';

export const NOTIFICATIONS_DELAYS = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
};

const getNextNotificationDate = () =>
  new Date(Date.now() + NOTIFICATIONS_DELAYS.DAILY);

@Injectable()
export class UserNotificationsService {
  constructor(
    @InjectModel(UserNotifications.name)
    private userNotificationModel: Model<UserNotifications>,
  ) {}

  async getExpiredNotifications() {
    return this.userNotificationModel
      .find({ nextLoginNotificationDate: { $lt: new Date() } })
      .populate('user', null, User.name);
  }

  async markAsNotified(notification: UserNotifications) {
    await this.userNotificationModel.updateOne(
      { _id: notification._id },
      {
        nextLoginNotificationDate: getNextNotificationDate(),
      },
    );
  }

  async getOrCreateUserNotification(user: User) {
    try {
      const notification = await this.userNotificationModel.findOne({
        user: user._id,
      });

      if (notification) {
        await this.markAsNotified(notification);

        return notification;
      } else {
        const newNotification = new this.userNotificationModel({
          user: user._id,
          nextLoginNotificationDate: getNextNotificationDate(),
        });

        await newNotification.save();

        return newNotification;
      }
    } catch (error) {
      console.error('Error in getOrCreateUserNotification', error);
    }
  }
}
