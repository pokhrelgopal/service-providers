import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Skill } from './skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
  ) {}

  findAll(): Promise<Skill[]> {
    return this.skills.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  findByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.skills.find({ where: { id: In(ids) } });
  }
}
