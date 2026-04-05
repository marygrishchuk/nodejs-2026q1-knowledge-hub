import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './interfaces/category.interface';

@Injectable()
export class CategoryService {
  private categories: Category[] = [];

  findAll(): Category[] {
    return this.categories;
  }

  findById(id: string): Category {
    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
    };
    this.categories.push(category);
    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const category = this.findById(id);
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    return category;
  }

  delete(id: string): void {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    this.categories.splice(index, 1);
  }
}
