import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Application } from './application.entity';

@Entity('documents')
export class Document extends BaseEntity {
  @Column()
  application_id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column()
  document_type: string;

  @Column()
  file_url: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploaded_at: Date;
}
