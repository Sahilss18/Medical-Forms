export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  SCRUTINY = 'SCRUTINY',
  CLARIFICATION = 'CLARIFICATION',
  INSPECTION_ASSIGNED = 'INSPECTION_ASSIGNED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  DECISION_PENDING = 'DECISION_PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Form } from '../../forms/entities/form.entity';
import { Institution } from '../../institutions/entities/institution.entity';
import { LicensingOffice } from '../../offices/entities/office.entity';
import { ApplicationValue } from './value.entity';
import { Document } from './document.entity';

@Entity('applications')
export class Application extends BaseEntity {
  @Column({ unique: true })
  application_number: string;

  @Column()
  form_id: string;

  @ManyToOne(() => Form)
  @JoinColumn({ name: 'form_id' })
  form: Form;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  office_id: string;

  @ManyToOne(() => LicensingOffice)
  @JoinColumn({ name: 'office_id' })
  office: LicensingOffice;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.SUBMITTED })
  status: ApplicationStatus;

  @Column({ nullable: true })
  current_stage: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submitted_at: Date;

  @OneToMany(() => ApplicationValue, (value) => value.application)
  values: ApplicationValue[];

  @OneToMany(() => Document, (document) => document.application)
  documents: Document[];
}
