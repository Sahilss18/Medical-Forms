import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { LicensingOffice } from '../../offices/entities/office.entity';
import { InspectorJurisdiction } from './jurisdiction.entity';

@Entity('inspectors')
export class Inspector extends BaseEntity {
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

  @Column()
  employee_code: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => InspectorJurisdiction, (jurisdiction) => jurisdiction.inspector)
  jurisdictions: InspectorJurisdiction[];
}
