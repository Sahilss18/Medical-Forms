export enum InspectionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Application } from '../../applications/entities/application.entity';
import { Inspector } from '../../inspectors/entities/inspector.entity';
import { InspectionReport } from './report.entity';

@Entity('inspection_assignments')
export class InspectionAssignment extends BaseEntity {
  @Column()
  application_id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column()
  inspector_id: string;

  @ManyToOne(() => Inspector)
  @JoinColumn({ name: 'inspector_id' })
  inspector: Inspector;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assigned_at: Date;

  @Column({ type: 'enum', enum: InspectionStatus, default: InspectionStatus.PENDING })
  status: InspectionStatus;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @OneToOne(() => InspectionReport, (report) => report.assignment)
  report: InspectionReport;
}
