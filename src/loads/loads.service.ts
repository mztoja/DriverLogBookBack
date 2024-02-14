import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoadCreateDto } from './dto/load-create.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadEntity } from './load.entity';
import { LogsService } from '../logs/logs.service';
import { LoadInterface, logTypeEnum, loadStatusEnum } from '../types';
import { PlaceEntity } from '../places/place.entity';
import { LoadUnloadDto } from './dto/load-unload.dto';
import { LogEntity } from '../logs/log.entity';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(LoadEntity)
    private loadRepository: Repository<LoadEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}

  async findById(id: number): Promise<LoadEntity> {
    try {
      return await this.loadRepository.findOne({
        where: { id },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getLastLoad(userId: string): Promise<LoadEntity> {
    try {
      return await this.loadRepository.findOne({
        where: { userId },
        order: { id: 'DESC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getNotUnloadedLoads(userId: string): Promise<LoadInterface[]> {
    try {
      return await this.loadRepository
        .createQueryBuilder('load')
        .where('load.userId = :userId AND load.status = :status', {
          userId,
          status: loadStatusEnum.notUnloaded,
        })
        .leftJoinAndMapOne(
          'load.receiverData',
          PlaceEntity,
          'receiver',
          'load.receiverId = receiver.id',
        )
        .orderBy('load.id', 'DESC')
        .getMany();
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getLoadsByTour(
    userId: string,
    tourId: number,
  ): Promise<LoadInterface[]> {
    const query = await this.loadRepository
      .createQueryBuilder('load')
      .where('load.userId = :userId AND load.tourId = :tourId', {
        userId,
        tourId,
      })
      .leftJoinAndMapOne(
        'load.loadingLogData',
        LogEntity,
        'loadingLog',
        'load.loadingLogId = loadingLog.id',
      )
      .leftJoinAndMapOne(
        'load.unloadingLogData',
        LogEntity,
        'unloadingLog',
        'load.unloadingLogId = unloadingLog.id',
      )
      .leftJoinAndMapOne(
        'load.senderData',
        PlaceEntity,
        'senderLog',
        'load.senderId = senderLog.id',
      )
      .leftJoinAndMapOne(
        'load.receiverData',
        PlaceEntity,
        'receiverLog',
        'load.receiverId = receiverLog.id',
      )
      .orderBy('load.id', 'DESC');
    return await query.getMany();
  }

  async create(
    userId: string,
    data: LoadCreateDto,
    tourId: number,
  ): Promise<LoadEntity> {
    try {
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
      const newAction = log.action.replace(/\./, `. ${loadNr} `);
      await this.logsService.setAction(log.id, newAction);
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
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async unload(
    data: LoadUnloadDto,
    load: LoadEntity,
    tourId: number,
    userId: string,
  ): Promise<LoadEntity> {
    try {
      const startLog = await this.logsService.find(load.loadingLogId);
      const action = data.action.replace('.value.', `${load.loadNr}`);
      const stopLog = await this.logsService.create(
        {
          date: data.date,
          place: data.isPlaceAsReceiver ? '' : data.place,
          placeId: data.isPlaceAsReceiver ? load.receiverId : data.placeId,
          country: data.country,
          odometer: data.odometer,
          action: action,
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
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
