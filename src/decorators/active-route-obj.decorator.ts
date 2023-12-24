import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TourEntity } from '../tours/tour.entity';

export const ActiveRouteObj = createParamDecorator(
  (data: any, context: ExecutionContext): TourEntity => {
    return context.switchToHttp().getRequest().activeRoute;
  },
);
