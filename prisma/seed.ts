import 'dotenv/config';
import { PrismaClient, ArticleStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hashPassword = async (password: string): Promise<string> => {
  const rounds = parseInt(process.env.CRYPT_SALT ?? '10', 10);
  return bcrypt.hash(password, rounds);
};

const main = async () => {
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      login: 'seed_admin',
      password: await hashPassword('admin_pass'),
      role: UserRole.ADMIN,
    },
  });

  const editor = await prisma.user.create({
    data: {
      login: 'seed_editor',
      password: await hashPassword('editor_pass'),
      role: UserRole.EDITOR,
    },
  });

  const catTech = await prisma.category.create({
    data: { name: 'Technology', description: 'Tech articles' },
  });
  const catLife = await prisma.category.create({
    data: { name: 'Lifestyle', description: 'Life topics' },
  });
  const catNews = await prisma.category.create({
    data: { name: 'News', description: 'Current events' },
  });

  const tagNames = ['nestjs', 'prisma', 'docker', 'typescript', 'postgres'];
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.create({ data: { name } })),
  );

  const tagByName = (name: string) => {
    const t = tags.find((x) => x.name === name);
    if (!t) throw new Error(`Missing tag ${name}`);
    return { id: t.id };
  };

  const article1 = await prisma.article.create({
    data: {
      title: 'Draft in Tech',
      content: 'Work in progress.',
      status: ArticleStatus.DRAFT,
      authorId: admin.id,
      categoryId: catTech.id,
      tags: { connect: [tagByName('nestjs'), tagByName('typescript')] },
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'Published guide',
      content: 'Full Prisma guide.',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: catTech.id,
      tags: { connect: [tagByName('prisma'), tagByName('postgres')] },
    },
  });

  const article3 = await prisma.article.create({
    data: {
      title: 'Lifestyle tips',
      content: 'Daily habits.',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: catLife.id,
      tags: { connect: [tagByName('typescript')] },
    },
  });

  const article4 = await prisma.article.create({
    data: {
      title: 'Archived piece',
      content: 'Old news.',
      status: ArticleStatus.ARCHIVED,
      authorId: admin.id,
      categoryId: catNews.id,
      tags: { connect: [tagByName('docker'), tagByName('nestjs')] },
    },
  });

  const article5 = await prisma.article.create({
    data: {
      title: 'Cross-topic',
      content: 'Multiple tags.',
      status: ArticleStatus.DRAFT,
      authorId: null,
      categoryId: null,
      tags: {
        connect: [
          tagByName('docker'),
          tagByName('prisma'),
          tagByName('postgres'),
        ],
      },
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        content: 'Great draft!',
        articleId: article1.id,
        authorId: editor.id,
      },
      {
        content: 'Thanks for publishing.',
        articleId: article2.id,
        authorId: admin.id,
      },
      {
        content: 'Useful lifestyle notes.',
        articleId: article3.id,
        authorId: null,
      },
    ],
  });

  console.log(
    `Seeded ${article1.id}, ${article2.id}, ${article3.id}, ${article4.id}, ${article5.id} articles and related data.`,
  );
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
