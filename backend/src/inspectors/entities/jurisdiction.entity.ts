import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Inspector } from './inspector.entity';

@Entity('inspector_jurisdictions')
export class InspectorJurisdiction extends BaseEntity {
  @Column()
  inspector_id: string;

  @ManyToOne(() => Inspector, (inspector) => inspector.jurisdictions)
  @JoinColumn({ name: 'inspector_id' })
  inspector: Inspector;

  @Column()
  state: string;

  @Column()
  district: string;

  @Column()
  taluk: string;
}
