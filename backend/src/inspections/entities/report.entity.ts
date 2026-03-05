export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
}

import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { InspectionAssignment } from './assignment.entity';

@Entity('inspection_reports')
export class InspectionReport extends BaseEntity {
  @Column()
  inspection_id: string;

  @OneToOne(() => InspectionAssignment, (assignment) => assignment.report)
  @JoinColumn({ name: 'inspection_id' })
  assignment: InspectionAssignment;

  @Column({ type: 'jsonb', nullable: true })
  checklist_items: any;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'text', nullable: true })
  report_text: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recommendation: string;

  @Column({ type: 'enum', enum: ComplianceStatus })
  compliance_status: ComplianceStatus;

  @Column({ type: 'jsonb', nullable: true })
  photos: any;

  @Column({ type: 'text', nullable: true })
  photos_url: string;

  @Column({ type: 'date', nullable: true })
  inspection_date: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submitted_at: Date;
}
