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

  @Column('text')
  report_text: string;

  @Column({ type: 'enum', enum: ComplianceStatus })
  compliance_status: ComplianceStatus;

  @Column({ type: 'text', nullable: true })
  photos_url: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submitted_at: Date;
}
