import { forwardRef, Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursEntity } from './tours.entity';
import { AuthenticationModule } from '../authentication/authentication.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToursEntity]),
    forwardRef(() => AuthenticationModule),
    forwardRef(() => LogsModule),
  ],
  providers: [ToursService],
  controllers: [ToursController],
})
export class ToursModule {}
