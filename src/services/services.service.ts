import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { logTypeEnum, serviceTypeEnum } from '../types';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}
  async create(
    userId: string,
    data: CreateServiceDto,
    tourId: number,
  ): Promise<ServiceEntity> {
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };

    const serviceTypeToLogTypeMap = {
      [serviceTypeEnum.maintenance]: logTypeEnum.maintenance,
      [serviceTypeEnum.service]: logTypeEnum.service,
    };

    const log = await this.logsService.create(
      logData,
      userId,
      tourId,
      serviceTypeToLogTypeMap[data.serviceType],
    );

    return await this.serviceRepository.save({
      userId,
      vehicleId: data.serviceVehicleId,
      logId: log.id,
      entry: data.serviceEntry,
      type: data.serviceType,
    });
  }
}
