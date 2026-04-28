import 'reflect-metadata';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateArticleDto } from './article/dto/create-article.dto';
import { ArticleStatus, UserRole } from './common/enums';
import { CreateUserDto } from './user/dto/create-user.dto';
import { SignupDto } from './auth/dto/signup.dto';

describe('DTO Validation — SignupDto', () => {
  it('passes for valid login and password', async () => {
    const dto = Object.assign(new SignupDto(), {
      login: 'alice',
      password: 'pass123',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const dto = Object.assign(new SignupDto(), { password: 'pass123' });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = Object.assign(new SignupDto(), { login: 'alice' });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'password')).toBe(true);
  });

  it('fails when login is empty string', async () => {
    const dto = Object.assign(new SignupDto(), { login: '', password: 'pass' });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'login')).toBe(true);
  });

  it('fails when password is empty string', async () => {
    const dto = Object.assign(new SignupDto(), {
      login: 'alice',
      password: '',
    });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'password')).toBe(true);
  });
});

describe('DTO Validation — CreateUserDto', () => {
  it('passes for valid login, password, and optional role', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      login: 'bob',
      password: 'secret',
      role: UserRole.EDITOR,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes without role (role is optional)', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      login: 'bob',
      password: 'secret',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const dto = Object.assign(new CreateUserDto(), { password: 'secret' });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'login')).toBe(true);
  });

  it('fails for invalid role enum value', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      login: 'bob',
      password: 'secret',
      role: 'superadmin',
    });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'role')).toBe(true);
  });
});

describe('DTO Validation — CreateArticleDto', () => {
  it('passes for valid title and content', async () => {
    const dto = Object.assign(new CreateArticleDto(), {
      title: 'NestJS Guide',
      content: 'Full content here',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes with all optional fields populated', async () => {
    const dto = Object.assign(new CreateArticleDto(), {
      title: 'NestJS Guide',
      content: 'Full content here',
      status: ArticleStatus.PUBLISHED,
      tags: ['typescript', 'nestjs'],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails when title is missing', async () => {
    const dto = Object.assign(new CreateArticleDto(), {
      content: 'Some content',
    });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'title')).toBe(true);
  });

  it('fails when content is missing', async () => {
    const dto = Object.assign(new CreateArticleDto(), {
      title: 'Some title',
    });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'content')).toBe(true);
  });

  it('fails for invalid status enum value', async () => {
    const dto = Object.assign(new CreateArticleDto(), {
      title: 'Title',
      content: 'Content',
      status: 'invalid-status',
    });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'status')).toBe(true);
  });

  it('fails when tags is not an array', async () => {
    const dto = Object.assign(new CreateArticleDto(), {
      title: 'Title',
      content: 'Content',
      tags: 'not-an-array',
    });

    const errors = await validate(dto);

    expect(errors.some((err) => err.property === 'tags')).toBe(true);
  });
});
