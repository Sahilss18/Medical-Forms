import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspector } from './entities/inspector.entity';
import { InspectorsController } from './inspectors.controller';
import { InspectorsService } from './inspectors.service';
import { User } from '../users/entities/user.entity';
import { LicensingOffice } from '../offices/entities/office.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Inspector, User, LicensingOffice])],
	controllers: [InspectorsController],
	providers: [InspectorsService],
	exports: [InspectorsService],
})
export class InspectorsModule {}
