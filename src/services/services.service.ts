import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { logTypeEnum, ServiceInterface, serviceTypeEnum, tourStatusEnum } from '../types';
import { LogEntity } from '../logs/log.entity';
import { PlaceEntity } from '../places/place.entity';
import { EditServiceDto } from './dto/edit-service.dto';
import { ToursService } from '../tours/tours.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity) private serviceRepository: Repository<ServiceEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
    @Inject(forwardRef(() => ToursService)) private toursService: ToursService,
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

  async edit(userId: string, data: EditServiceDto): Promise<ServiceEntity> {
    const oldService = await this.serviceRepository.findOne({ where: { userId, id: data.id } });
    const log = await this.logsService.find(oldService.logId);
    if (!oldService || !log) {
      throw new BadRequestException();
    }
    const tour = await this.toursService.getRouteById(userId, log.tourId);
    if (!tour || tour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }
    await this.logsService.edit(data.logData, userId);
    await this.serviceRepository.update(
      { id: oldService.id },
      {
        entry: data.entry,
        type: data.type,
      },
    );
    return await this.serviceRepository.findOne({ where: { id: oldService.id } });
  }
}
