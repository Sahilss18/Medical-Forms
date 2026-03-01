export enum ApprovalLevel {
  SCRUTINY = 'SCRUTINY',
  FINAL = 'FINAL',
}

import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { LicensingOffice } from '../../offices/entities/office.entity';

@Entity('licensing_officers')
export class LicensingOfficer extends BaseEntity {
  @Column()
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  office_id: string;

  @ManyToOne(() => LicensingOffice)
  @JoinColumn({ name: 'office_id' })
  office: LicensingOffice;

  @Column({ type: 'enum', enum: ApprovalLevel })
  approval_level: ApprovalLevel;

  @Column({ default: true })
  active: boolean;
}
