import { FinanceInterface } from './FinanceInterface';

export interface FinanceListResponse {
  items: FinanceInterface[];
  totalItems: number;
}
