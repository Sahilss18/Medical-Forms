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

  @Column('text')
  address: string;

  @Column()
  district: string;

  @Column()
  contact_person: string;

  @Column()
  contact_phone: string;
}
