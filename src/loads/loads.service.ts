import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { LoadCreateDto } from './dto/load-create.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadEntity } from './load.entity';
import { LogsService } from '../logs/logs.service';
import { LoadInterface, logTypeEnum, loadStatusEnum, LoadListResponse, tourStatusEnum } from '../types';
import { PlaceEntity } from '../places/place.entity';
import { LoadUnloadDto } from './dto/load-unload.dto';
import { LogEntity } from '../logs/log.entity';
import { ToursService } from '../tours/tours.service';
import { LoadEditDto } from './dto/load-edit.dto';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(LoadEntity) private loadRepository: Repository<LoadEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
    @Inject(forwardRef(() => ToursService)) private toursService: ToursService,
  ) {}

  async findById(id: number): Promise<LoadEntity> {
    return await this.loadRepository.findOne({
      where: { id },
    });
  }

  async calcAvgWeightByTour(tourId: number, userId: string): Promise<number> {
    const loads = await this.loadRepository.find({ where: { tourId, userId } });
    if (loads.length === 0) {
      return 0;
    }
    const sum = loads.reduce((sum, load) => sum + Number(load.weight), 0);
    return Math.round(sum / loads.length);
  }

  async getLastLoad(userId: string): Promise<LoadEntity> {
    return await this.loadRepository.findOne({
      where: { userId },
      order: { id: 'DESC' },
    });
  }

  async getNotUnloadedLoads(userId: string): Promise<LoadInterface[]> {
    return await this.loadRepository
      .createQueryBuilder('load')
      .where('load.userId = :userId AND load.status = :status', {
        userId,
        status: loadStatusEnum.notUnloaded,
      })
      .leftJoinAndMapOne('load.receiverData', PlaceEntity, 'receiver', 'load.receiverId = receiver.id')
      .orderBy('load.id', 'DESC')
      .getMany();
  }

  async getNotUnloadedLoadsMass(userId: string): Promise<number> {
    const result = await this.loadRepository
      .createQueryBuilder('load')
      .select('SUM(load.weight)', 'sum')
      .where('load.userId = :userId AND load.status = :status', {
        userId,
        status: loadStatusEnum.notUnloaded,
      })
      .getRawOne();
    return result ? result.sum : 0;
  }

  async getLoadsByTour(userId: string, tourId: number): Promise<LoadInterface[]> {
    const query = await this.loadRepository
      .createQueryBuilder('load')
      .where('load.userId = :userId AND load.tourId = :tourId', {
        userId,
        tourId,
      })
      .leftJoinAndMapOne('load.loadingLogData', LogEntity, 'loadingLog', 'load.loadingLogId = loadingLog.id')
      .leftJoinAndMapOne('loadingLog.placeData', PlaceEntity, 'loadingPlace', 'loadingLog.placeId = loadingPlace.id')
      .leftJoinAndMapOne('load.unloadingLogData', LogEntity, 'unloadingLog', 'load.unloadingLogId = unloadingLog.id')
      .leftJoinAndMapOne(
        'unloadingLog.placeData',
        PlaceEntity,
        'unloadingPlace',
        'unloadingLog.placeId = unloadingPlace.id',
      )
      .leftJoinAndMapOne('load.senderData', PlaceEntity, 'senderLog', 'load.senderId = senderLog.id')
      .leftJoinAndMapOne('load.receiverData', PlaceEntity, 'receiverLog', 'load.receiverId = receiverLog.id')
      .orderBy('load.id', 'DESC');
    return await query.getMany();
  }

  async create(userId: string, data: LoadCreateDto, tourId: number): Promise<LoadEntity> {
    const log = await this.logsService.create(
      {
        date: data.date,
        place: data.place,
        placeId: data.placeId,
        country: data.country,
        odometer: data.odometer,
        action: data.action,
        notes: data.notes,
      },
      userId,
      tourId,
      logTypeEnum.finishLoading,
    );
    let loadNr = 1;
    const lastLoad = await this.getLastLoad(userId);
    if (lastLoad) {
      loadNr = lastLoad.loadNr + 1;
    }
    await this.toursService.addLoading(tourId, userId, data.weight);
    return await this.loadRepository.save({
      userId,
      tourId,
      loadNr,
      status: loadStatusEnum.notUnloaded,
      distance: 0,
      loadingLogId: log.id,
      description: data.description,
      quantity: data.quantity,
      receiverId: data.receiverId,
      senderId: data.senderId,
      reference: data.reference,
      vehicle: data.vehicle,
      weight: data.weight,
      unloadingLogId: 0,
    });
  }

  async edit(userId: string, data: LoadEditDto, simpleEdit?: boolean): Promise<LoadInterface> {
    const oldLoad = await this.loadRepository.findOne({ where: { id: data.id, userId } });
    if (!oldLoad) {
      throw new BadRequestException();
    }
    const tour = await this.toursService.getRouteById(userId, oldLoad.tourId);
    if (!tour || tour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }
    await this.logsService.edit(data.loadingLogData, userId);
    if (!simpleEdit) {
      await this.logsService.edit(data.unloadingLogData, userId);
    }
    await this.loadRepository.update(
      { id: oldLoad.id },
      {
        distance: data.distance,
        description: data.description,
        quantity: data.quantity,
        receiverId: data.receiverId,
        senderId: data.senderId,
        reference: data.reference,
        vehicle: data.vehicle,
        weight: data.weight,
      },
    );
    await this.toursService.editAvgWeight(oldLoad.tourId, await this.calcAvgWeightByTour(oldLoad.tourId, userId));
    return await this.findById(oldLoad.id);
  }

  async unload(data: LoadUnloadDto, load: LoadEntity, tourId: number, userId: string): Promise<LoadEntity> {
    const startLog = await this.logsService.find(load.loadingLogId);
    const stopLog = await this.logsService.create(
      {
        date: data.date,
        place: data.isPlaceAsReceiver ? '' : data.place,
        placeId: data.isPlaceAsReceiver ? load.receiverId : data.placeId,
        country: data.country,
        odometer: data.odometer,
        action: data.action,
        notes: data.notes,
      },
      userId,
      tourId,
      logTypeEnum.finishUnloading,
    );
    const distance = stopLog.odometer - startLog.odometer;
    await this.loadRepository.update(
      { id: load.id },
      {
        status: loadStatusEnum.unloaded,
        distance: distance < 0 ? 0 : distance,
        unloadingLogId: stopLog.id,
      },
    );
    return await this.findById(load.id);
  }

  async get(userId: string, page: string, perPage: string): Promise<LoadListResponse> {
    const query = await this.loadRepository
      .createQueryBuilder('load')
      .where('load.userId = :userId', {
        userId,
      })
      .leftJoinAndMapOne('load.loadingLogData', LogEntity, 'loadingLog', 'load.loadingLogId = loadingLog.id')
      .leftJoinAndMapOne('loadingLog.placeData', PlaceEntity, 'loadingPlace', 'loadingLog.placeId = loadingPlace.id')
      .leftJoinAndMapOne('load.unloadingLogData', LogEntity, 'unloadingLog', 'load.unloadingLogId = unloadingLog.id')
      .leftJoinAndMapOne(
        'unloadingLog.placeData',
        PlaceEntity,
        'unloadingPlace',
        'unloadingLog.placeId = unloadingPlace.id',
      )
      .leftJoinAndMapOne('load.senderData', PlaceEntity, 'senderLog', 'load.senderId = senderLog.id')
      .leftJoinAndMapOne('load.receiverData', PlaceEntity, 'receiverLog', 'load.receiverId = receiverLog.id')
      .orderBy('load.id', 'DESC')
      .skip((Number(page) - 1) * Number(perPage))
      .take(Number(perPage));
    const [items, totalItems] = await query.getManyAndCount();
    return { items, totalItems };
  }
}
