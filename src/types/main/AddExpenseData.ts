import { AddLogData } from './AddLogData';
import { ExpenseEnum } from '../finance';

export interface AddExpenseData extends AddLogData {
  payment: string;
  expenseQuantity: string;
  expenseUnitPrice: string;
  expenseItemDescription: string;
  expenseAmount: string;
  expenseCurrency: string;
  expenseForeignAmount: string;
  expenseForeignCurrency: string;
  expenseType: ExpenseEnum;
}
