import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

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
}
