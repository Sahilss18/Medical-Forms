import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Institution } from './institutions/entities/institution.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { OfficesModule } from './offices/offices.module';
import { InspectorsModule } from './inspectors/inspectors.module';
import { FormsModule } from './forms/forms.module';
import { ApplicationsModule } from './applications/applications.module';
import { InspectionsModule } from './inspections/inspections.module';
import { DecisionsModule } from './decisions/decisions.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Institution],
        synchronize: true, // Set to false in production
        logging: true,
      }),
    }),
    AuthModule,
    UsersModule,
    CommonModule,
    InstitutionsModule,
    OfficesModule,
    InspectorsModule,
    FormsModule,
    ApplicationsModule,
    InspectionsModule,
    DecisionsModule,
    CertificatesModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
