export enum DecisionStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLARIFICATION = 'CLARIFICATION',
}

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';

@Entity('decisions')
export class Decision extends BaseEntity {
  @Column()
  application_id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'enum', enum: DecisionStatus })
  decision: DecisionStatus;

  @Column('text')
  remarks: string;

  @Column()
  decided_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'decided_by' })
  officer: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  decided_at: Date;
}
