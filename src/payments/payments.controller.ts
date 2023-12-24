import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { PaymentEntity } from './payment.entity';
import { AddPaymentDto } from './dto/add-payment.dto';
import { DeletePaymentDto } from './dto/delete-payment.dto';
import { SelectPaymentDto } from './dto/select-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getPaymentsMethods(
    @UserObj() user: UserEntity,
  ): Promise<PaymentEntity[]> {
    return await this.paymentsService.getPaymentsMethods(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async add(
    @UserObj() user: UserEntity,
    @Body() data: AddPaymentDto,
  ): Promise<PaymentEntity[]> {
    return await this.paymentsService.add(user.id, data.paymentMethod);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async delete(
    @UserObj() user: UserEntity,
    @Body() data: DeletePaymentDto,
  ): Promise<PaymentEntity[]> {
    return await this.paymentsService.delete(user.id, data.paymentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('select')
  async select(
    @UserObj() user: UserEntity,
    @Body() data: SelectPaymentDto,
  ): Promise<PaymentEntity[]> {
    return await this.paymentsService.select(user.id, data.paymentId);
  }
}
