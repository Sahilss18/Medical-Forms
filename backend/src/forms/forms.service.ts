import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Form } from './entities/form.entity';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private formsRepository: Repository<Form>,
  ) {}

  async findAll(): Promise<Form[]> {
    return this.formsRepository.find({
      where: { active: true },
      relations: ['fields'],
      order: { form_code: 'ASC', fields: { order_index: 'ASC' } },
    });
  }

  async findByCode(formCode: string): Promise<Form> {
    const form = await this.formsRepository.findOne({
      where: { form_code: formCode },
      relations: ['fields'],
      order: { fields: { order_index: 'ASC' } },
    });

    if (!form) {
      throw new NotFoundException(`Form with code ${formCode} not found`);
    }

    return form;
  }

  async findByIdentifier(identifier: string): Promise<Form> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const where = isUuid
      ? [{ id: identifier }, { form_code: ILike(identifier) }]
      : [{ form_code: ILike(identifier) }];

    const form = await this.formsRepository.findOne({
      where,
      relations: ['fields'],
      order: { fields: { order_index: 'ASC' } },
    });

    if (!form) {
      throw new NotFoundException(`Form ${identifier} not found`);
    }

    return form;
  }
}
