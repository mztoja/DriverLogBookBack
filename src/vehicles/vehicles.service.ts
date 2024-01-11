import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, UpdateResult } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { VehicleAddDto } from './dto/vehicle-add.dto';
import { vehicleTypeEnum } from '../types';
import { VehicleTrailerEditDto } from './dto/vehicle-trailer-edit.dto';
import { VehicleTruckEditDto } from './dto/vehicle-truck-edit.dto';

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
    skipId?: number,
  ): Promise<VehicleEntity> {
    if (skipId) {
      return this.vehicleRepository.findOne({
        where: { registrationNr, userId, companyId, id: Not(skipId) },
      });
    }
    return this.vehicleRepository.findOne({
      where: { registrationNr, userId, companyId },
    });
  }

  async findById(id: number, userId: string): Promise<VehicleEntity> {
    return this.vehicleRepository.findOne({
      where: { id, userId },
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

  async getTrucksList(userId: string): Promise<VehicleEntity[]> {
    return this.vehicleRepository.find({
      where: { userId, type: vehicleTypeEnum.truck },
      order: { registrationNr: 'ASC' },
    });
  }

  async getTrailersList(userId: string): Promise<VehicleEntity[]> {
    return this.vehicleRepository.find({
      where: { userId, type: vehicleTypeEnum.trailer },
      order: { registrationNr: 'ASC' },
    });
  }

  async trailerEdit(
    id: number,
    data: VehicleTrailerEditDto,
  ): Promise<UpdateResult> {
    return await this.vehicleRepository.update(
      { id },
      {
        registrationNr: data.registrationNr,
        weight: data.weight,
        year: data.year,
        model: data.model,
        techRev: data.techRev,
        insurance: data.insurance,
        notes: data.notes === '' ? null : data.notes,
      },
    );
  }

  async truckEdit(
    id: number,
    data: VehicleTruckEditDto,
  ): Promise<UpdateResult> {
    return await this.vehicleRepository.update(
      { id },
      {
        registrationNr: data.registrationNr,
        isLoadable: data.isLoadable,
        weight: data.weight,
        year: data.year,
        model: data.model,
        fuel: data.fuel,
        techRev: data.techRev,
        insurance: data.insurance,
        tacho: data.tacho,
        service: data.service,
        notes: data.notes === '' ? null : data.notes,
      },
    );
  }
}
