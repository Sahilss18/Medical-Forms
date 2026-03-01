export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  FILE = 'file',
  SELECT = 'select',
}

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Form } from './form.entity';

@Entity('form_fields')
export class FormField extends BaseEntity {
  @Column()
  form_id: string;

  @ManyToOne(() => Form, (form) => form.fields)
  @JoinColumn({ name: 'form_id' })
  form: Form;

  @Column()
  label: string;

  @Column()
  field_name: string;

  @Column({ type: 'enum', enum: FieldType })
  field_type: FieldType;

  @Column({ default: false })
  required: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validation_rules: any;

  @Column({ default: 0 })
  order_index: number;
}
