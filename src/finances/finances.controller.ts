import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { FinanceEntity } from './finance.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { FinanceCreateDto } from './dto/finance-create.dto';
import { ActiveRouteGuard } from '../guards/active-route.guard';
import { ActiveRouteObj } from '../decorators/active-route-obj.decorator';
import { TourEntity } from '../tours/tour.entity';

@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('create')
  async create(
    @Body() data: FinanceCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<FinanceEntity> {
    return await this.financesService.create(user.id, data, activeRoute.id);
  }
}
