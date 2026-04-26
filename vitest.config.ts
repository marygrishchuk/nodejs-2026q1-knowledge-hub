import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.unit.spec.ts'],
    oxc: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        'src/prisma/**',
        'src/additional-tests/**',
        'src/**/*.interface.ts',
        'src/**/*.dto.ts',
        'src/**/*.controller.ts',
        'src/common/middleware/**',
        'src/common/constants/**',
        'src/app.service.ts',
        'src/**/*.types.ts',
        'src/common/enums.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
      reporter: ['text', 'json', 'html'],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2017',
      },
      module: { type: 'es6' },
    }),
  ],
});
