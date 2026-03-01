import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';

@Entity('queries')
export class Query extends BaseEntity {
  @Column()
  application_id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column('text')
  message: string;

  @Column()
  raised_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'raised_by' })
  user: User;

  @Column({ default: false })
  resolved: boolean;
}
