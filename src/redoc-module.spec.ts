import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import request from 'supertest';
import { RedocModule } from './redoc-module';

describe('test redoc-module.ts file', () => {
  let app: INestApplication;
  let swagger: OpenAPIObject;

  it('should be truthy', () => {
    expect(RedocModule).toBeTruthy();
  });

  describe('test express app setup', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({}).compile();
      app = module.createNestApplication();
      const options = new DocumentBuilder()
        .setDescription('Test swagger Doc')
        .build();
      swagger = SwaggerModule.createDocument(app, options);
    });

    it('should run the setup (non-normalized path)', async () => {
      await expect(
        RedocModule.setup('some/path', app, swagger, {})
      ).resolves.toBe(undefined);
    });
    it('should run the setup (normalized path)', async () => {
      await expect(
        RedocModule.setup('/some/path', app, swagger, {})
      ).resolves.toBe(undefined);
    });
    it('should run the setup (normalized path 2)', async () => {
      await expect(
        RedocModule.setup('/some/path/', app, swagger, {})
      ).resolves.toBe(undefined);
    });
    it('should be fine with the setup with logo options', async () => {
      await expect(
        RedocModule.setup('some/path', app, swagger, {
          logo: {
            url: 'http://localhost:3333/test.png',
          },
        })
      ).resolves.toBe(undefined);
    });
    it('should server the documentation', async () => {
      swagger.info = {
        title: 'some title',
        version: '0.1',
      };
      await RedocModule.setup('/doc', app, swagger, {
        theme: {},
      });
      await app.init();
      await request(app.getHttpServer()).get('/doc').expect(200);
      await request(app.getHttpServer())
        .get('/doc/swagger.json', (result) => console.log(result))
        .expect(200);
      await app.close();
    });
  });

  describe('test fastify app setup', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({}).compile();
      app = module.createNestApplication(new FastifyAdapter());
      const options = new DocumentBuilder()
        .setDescription('Test swagger Doc')
        .build();
      swagger = SwaggerModule.createDocument(app, options);
    });

    it('should throw an error for now', async () => {
      try {
        await RedocModule.setup('some/path', app, swagger, {});
      } catch (error) {
        expect(error.message).toBe('Fastify is not implemented yet');
      }
    });
  });
  describe('weird error', () => {
    let app: INestApplication;
    let swagger: OpenAPIObject;

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [RedocModule],
      }).compile();

      app = moduleFixture.createNestApplication(new FastifyAdapter());
      await app.init();
      const options = new DocumentBuilder()
        .setDescription('Test swagger Doc')
        .build();
      swagger = SwaggerModule.createDocument(app, options);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should throw an error for an invalid uri', async () => {
      try {
        await RedocModule.setup('some/path', app, swagger, {
          logo: { url: 'notaUrl' },
        });
      } catch (error) {
        expect(error.message).toBe('"logo.url" must be a valid uri');
      }
    });
  });
});
