import { userBidTypeEnum } from '../types';

export const calculateSalary = (
  bid: number,
  type: userBidTypeEnum,
  distance: number,
  days: number,
): number => {
  switch (type) {
    case userBidTypeEnum.notSpecified:
      return 0;
    case userBidTypeEnum.fixedSalary:
      const percent = Math.round((100 * days) / 30);
      return Math.round((bid * percent) / 100);
    case userBidTypeEnum.perDay:
      return Math.round(bid * days);
    case userBidTypeEnum.perKm:
      return Math.round(distance * bid);
    default:
      return 0;
  }
};
