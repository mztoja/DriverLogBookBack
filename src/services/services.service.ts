import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { logTypeEnum, ServiceInterface, serviceTypeEnum } from '../types';
import { LogEntity } from '../logs/log.entity';
import { PlaceEntity } from '../places/place.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity) private serviceRepository: Repository<ServiceEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
  ) {}
  async create(userId: string, data: CreateServiceDto, tourId: number): Promise<ServiceEntity> {
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

    const log = await this.logsService.create(logData, userId, tourId, serviceTypeToLogTypeMap[data.serviceType]);

    return await this.serviceRepository.save({
      userId,
      vehicleId: data.serviceVehicleId,
      logId: log.id,
      entry: data.serviceEntry,
      type: data.serviceType,
    });
  }

  async getByVehicleId(id: number, userId: string): Promise<ServiceInterface[]> {
    return this.serviceRepository
      .createQueryBuilder('services')
      .where('services.userId = :userId AND services.vehicleId = :id', {
        userId,
        id,
      })
      .leftJoinAndMapOne('services.logData', LogEntity, 'logId', 'services.logId = logId.id')
      .leftJoinAndMapOne('logId.placeData', PlaceEntity, 'place', 'logId.placeId = place.id')
      .orderBy('services.id', 'DESC')
      .getMany();
  }
}
