import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Application } from './application.entity';
import { FormField } from '../../forms/entities/field.entity';

@Entity('application_values')
export class ApplicationValue extends BaseEntity {
  @Column()
  application_id: string;

  @ManyToOne(() => Application, (app) => app.values)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column()
  field_id: string;

  @ManyToOne(() => FormField)
  @JoinColumn({ name: 'field_id' })
  field: FormField;

  @Column({ type: 'text', nullable: true })
  value_text: string;

  @Column({ type: 'text', nullable: true })
  value_file_url: string;
}
