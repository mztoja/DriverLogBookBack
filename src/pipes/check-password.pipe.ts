import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { passwordRegExp } from '../config/regexp';

@Injectable()
export class CheckPasswordPipe implements PipeTransform {
  constructor() {}

  transform(value: any): string {
    if (value.password && !passwordRegExp().test(value.password)) {
      throw new BadRequestException('password');
    }
    return value;
  }
}
