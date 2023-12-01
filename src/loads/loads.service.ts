import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoadCreateDto } from './dto/load.create.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadEntity } from './load.entity';
import { LogsService } from '../logs/logs.service';
import { LoadInterface, logTypeEnum } from '../types';
import { loadStatusEnum } from '../types/load/LoadEnums';
import { PlaceEntity } from '../places/place.entity';

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
}
