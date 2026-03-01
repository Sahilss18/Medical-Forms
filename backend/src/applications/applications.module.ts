import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowService } from './workflow.service';
import { Application } from './entities/application.entity';
import { ApplicationValue } from './entities/value.entity';
import { Document } from './entities/document.entity';
import { Query } from './entities/query.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application, 
      ApplicationValue, 
      Document, 
      Query
    ])
  ],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class ApplicationsModule {}
