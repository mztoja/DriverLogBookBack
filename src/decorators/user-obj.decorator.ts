import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../users/user.entity';

export const UserObj = createParamDecorator(
  (data: any, context: ExecutionContext): UserEntity => {
    return context.switchToHttp().getRequest().user;
  },
);
