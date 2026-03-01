export enum OfficeType {
  STATE = 'STATE',
  REGIONAL = 'REGIONAL',
  DISTRICT = 'DISTRICT',
}

import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('licensing_offices')
export class LicensingOffice extends BaseEntity {
  @Column()
  office_name: string;

  @Column({ type: 'enum', enum: OfficeType })
  office_type: OfficeType;

  @Column()
  state: string;

  @Column()
  district: string;

  @Column({ nullable: true })
  parent_office_id: string;

  @ManyToOne(() => LicensingOffice, (office) => office.sub_offices)
  @JoinColumn({ name: 'parent_office_id' })
  parent_office: LicensingOffice;

  @OneToMany(() => LicensingOffice, (office) => office.parent_office)
  sub_offices: LicensingOffice[];
}
