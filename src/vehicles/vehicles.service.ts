import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { VehicleAddDto } from './dto/vehicle-add.dto';
import { vehicleTypeEnum } from '../types';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async findByRegistration(
    registrationNr: string,
    userId: string,
    companyId: number,
  ): Promise<VehicleEntity> {
    return this.vehicleRepository.findOne({
      where: { registrationNr, userId, companyId },
    });
  }

  async create(
    userId: string,
    companyId: number,
    data: VehicleAddDto,
  ): Promise<VehicleEntity> {
    return await this.vehicleRepository.save({
      userId,
      companyId,
      type: data.type,
      isLoadable:
        data.type === vehicleTypeEnum.trailer ? true : data.isLoadable,
      registrationNr: data.registrationNr,
      weight: data.weight,
      year: data.year,
      model: data.model,
      fuel: data.type === vehicleTypeEnum.trailer ? null : data.fuel,
      insurance: data.insurance,
      techRev: data.techRev,
      tacho: data.type === vehicleTypeEnum.trailer ? null : data.tacho,
      service: data.type === vehicleTypeEnum.trailer ? null : data.service,
      notes: data.notes === '' ? null : data.notes,
    });
  }
}
