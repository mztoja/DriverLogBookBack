import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivateResult = await super.canActivate(context);

    if (canActivateResult instanceof Promise) {
      return canActivateResult;
    }

    if (canActivateResult instanceof Observable) {
      const result = await firstValueFrom(canActivateResult);
      return Promise.resolve(result);
    }

    return Promise.resolve(canActivateResult);
  }
}
