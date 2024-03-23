import { LogEditData } from '../log';

export interface FinanceEditData {
  id: number;
  logData: LogEditData;
  itemDescription: string;
  quantity: string;
  amount: string;
  currency: string;
  foreignAmount: string;
  foreignCurrency: string;
  payment: string;
  unitPrice: string;
}
