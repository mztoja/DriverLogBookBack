import { forwardRef, Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from './log.entity';
import { ToursModule } from '../tours/tours.module';
import { UsersModule } from '../users/users.module';
import { BordersModule } from '../borders/borders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntity]),
    forwardRef(() => ToursModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BordersModule),
  ],
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService],
})
export class LogsModule {}
