import { createParamDecorator, BadRequestException } from '@nestjs/common';

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
