import {
  Injectable,
  CanActivate,
  BadRequestException,
  ExecutionContext,
} from '@nestjs/common';
import { ToursService } from '../tours/tours.service';

@Injectable()
export class ActiveRouteGuard implements CanActivate {
  constructor(private readonly toursService: ToursService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    request.activeRoute = activeRoute;
    return true;
  }
}
