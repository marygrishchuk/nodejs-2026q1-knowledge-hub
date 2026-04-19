import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusCodes } from 'http-status-codes';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Pagination and sorting (additional e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const jsonHeaders = { Accept: 'application/json' };

  describe('categories', () => {
    it('returns an array when page and limit are omitted', async () => {
      const response = await request(app.getHttpServer())
        .get('/category')
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('returns paginated shape with total, page, limit, data when page and limit are set', async () => {
      await request(app.getHttpServer())
        .post('/category')
        .set(jsonHeaders)
        .send({ name: 'SORT_PAG_A', description: 'd1' });
      await request(app.getHttpServer())
        .post('/category')
        .set(jsonHeaders)
        .send({ name: 'SORT_PAG_B', description: 'd2' });
      await request(app.getHttpServer())
        .post('/category')
        .set(jsonHeaders)
        .send({ name: 'SORT_PAG_C', description: 'd3' });

      const response = await request(app.getHttpServer())
        .get('/category')
        .query({ page: 1, limit: 2 })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toMatchObject({
        page: 1,
        limit: 2,
      });
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.total).toBe('number');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.total).toBeGreaterThanOrEqual(3);
    });

    it('sorts by sortBy and order when no pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/category')
        .query({ sortBy: 'name', order: 'desc' })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(Array.isArray(response.body)).toBe(true);
      const names = response.body.map(
        (category: { name: string }) => category.name,
      );
      const sortedCopy = [...names].sort((nameA, nameB) =>
        nameB.localeCompare(nameA),
      );
      expect(names).toEqual(sortedCopy);
    });

    it('responds BAD_REQUEST when only page is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/category')
        .query({ page: 1 })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    });

    it('responds BAD_REQUEST for invalid sortBy', async () => {
      const response = await request(app.getHttpServer())
        .get('/category')
        .query({ sortBy: 'notAField' })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe('users', () => {
    it('paginates users', async () => {
      await request(app.getHttpServer()).post('/user').set(jsonHeaders).send({
        login: 'pag_user_alpha',
        password: 'secret123',
      });
      await request(app.getHttpServer()).post('/user').set(jsonHeaders).send({
        login: 'pag_user_beta',
        password: 'secret123',
      });

      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ page: 1, limit: 1, sortBy: 'login', order: 'asc' })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toMatchObject({ page: 1, limit: 1 });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('articles', () => {
    it('filters and sorts articles', async () => {
      await request(app.getHttpServer())
        .post('/article')
        .set(jsonHeaders)
        .send({
          title: 'Zebra draft',
          content: 'c',
          status: 'draft',
          authorId: null,
          categoryId: null,
          tags: [],
        });
      await request(app.getHttpServer())
        .post('/article')
        .set(jsonHeaders)
        .send({
          title: 'Alpha draft',
          content: 'c',
          status: 'draft',
          authorId: null,
          categoryId: null,
          tags: [],
        });

      const response = await request(app.getHttpServer())
        .get('/article')
        .query({ status: 'draft', sortBy: 'title', order: 'asc' })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(Array.isArray(response.body)).toBe(true);
      const titles = response.body.map(
        (article: { title: string }) => article.title,
      );
      const sortedTitles = [...titles].sort((titleA, titleB) =>
        titleA.localeCompare(titleB),
      );
      expect(titles).toEqual(sortedTitles);
    });
  });

  describe('comments', () => {
    it('paginates comments for an article', async () => {
      const articleResponse = await request(app.getHttpServer())
        .post('/article')
        .set(jsonHeaders)
        .send({
          title: 'Comment host',
          content: 'c',
          status: 'published',
          authorId: null,
          categoryId: null,
          tags: [],
        });
      const articleId = articleResponse.body.id as string;

      await request(app.getHttpServer())
        .post('/comment')
        .set(jsonHeaders)
        .send({
          content: 'first',
          articleId,
          authorId: null,
        });
      await request(app.getHttpServer())
        .post('/comment')
        .set(jsonHeaders)
        .send({
          content: 'second',
          articleId,
          authorId: null,
        });

      const response = await request(app.getHttpServer())
        .get('/comment')
        .query({
          articleId,
          page: 1,
          limit: 1,
          sortBy: 'content',
          order: 'asc',
        })
        .set(jsonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toMatchObject({ page: 1, limit: 1 });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(2);
    });
  });
});
