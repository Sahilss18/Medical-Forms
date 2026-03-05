import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('institutions')
export class Institution extends BaseEntity {
  @Column()
  user_id: string;

  @OneToOne(() => User, (user) => user.institution)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  registration_number: string;

  @Column({ nullable: true })
  institution_type: string;

  @Column({ nullable: true })
  established_year: string;

  @Column({ nullable: true })
  license_number: string;

  @Column('text')
  address: string;

  @Column({ nullable: true })
  address_line2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column()
  district: string;

  @Column()
  contact_person: string;

  @Column()
  contact_phone: string;

  @Column({ nullable: true })
  contact_email: string;
}
