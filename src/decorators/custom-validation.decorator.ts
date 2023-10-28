import { createParamDecorator, BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

export const ValidatePlace = createParamDecorator((data, req) => {
  const { placeId, place } = req.body;

  if (placeId === '0' && place === '') {
    throw new BadRequestException('No place provided');
  }

  return req.body;
});

export const ValidateFuelQuantity = createParamDecorator((data, req) => {
  const { fuelQuantity } = req.body;

  if (Number(fuelQuantity) <= 0) {
    throw new BadRequestException('no fuel quantity');
  }

  return req.body;
});

export function IsCustomBoolean(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'isCustomBoolean',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          console.log('Walidujemy na ostro!: ', value);
          if (value === '0' || value === '1') {
            if (value === '0') {
              value = false;
            }
            if (value === '1') {
              value = true;
            }
            return true;
          }
          return false;
        },
      },
    });
  };
}
