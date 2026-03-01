import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Application } from '../../applications/entities/application.entity';

@Entity('certificates')
export class Certificate extends BaseEntity {
  @Column()
  application_id: string;

  @OneToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ unique: true })
  certificate_number: string;

  @Column({ type: 'date' })
  issue_date: Date;

  @Column({ type: 'date' })
  expiry_date: Date;

  @Column()
  pdf_url: string;

  @Column({ nullable: true })
  qr_code: string;
}
