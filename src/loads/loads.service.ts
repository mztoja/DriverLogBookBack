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
import { logTypeEnum } from '../types';
import { loadStatusEnum } from '../types/load/LoadEnums';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(LoadEntity)
    private loadRepository: Repository<LoadEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}

  async getLastLoad(userId: string): Promise<LoadEntity> {
    return await this.loadRepository.findOne({
      where: { userId, status: loadStatusEnum.unloaded },
      order: { id: 'DESC' },
    });
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
