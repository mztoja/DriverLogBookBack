export interface FinanceInterface {
  id: number;
  userId: string;
  tourId: number;
  logId: number;
  itemDescription: string;
  quantity: number;
  amount: number;
  currency: string;
  foreignAmount: number;
  foreignCurrency: string;
  payment: string;
}
