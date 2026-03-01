export enum UserRole {
  APPLICANT = 'APPLICANT',
  INSPECTOR = 'INSPECTOR',
  OFFICER = 'OFFICER',
  AUTHORITY = 'AUTHORITY',
  ADMIN = 'ADMIN',
}

import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Institution } from '../../institutions/entities/institution.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.APPLICANT })
  role: UserRole;

  @Column({ nullable: true })
  district: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToOne(() => Institution, (institution) => institution.user)
  institution: Institution;
}
