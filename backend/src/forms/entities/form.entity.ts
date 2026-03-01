import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FormField } from './field.entity';

@Entity('forms')
export class Form extends BaseEntity {
  @Column({ unique: true })
  form_code: string;

  @Column()
  title: string;

  @Column({ default: false })
  requires_inspection: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => FormField, (field) => field.form)
  fields: FormField[];
}
