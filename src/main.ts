import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { doubleCsrf } from 'csrf-csrf';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import * as cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';

const {
  // invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  //doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => process.env['ADMIN_CSRF_SECRET'] || randomUUID(),
  cookieOptions: {
    secure: `${process.env['NODE_ENV']}` === 'production',
  },
});

const getPort = () => {
  return process.env['INTERNAL_API_PORT']
    ? Number(process.env['INTERNAL_API_PORT'])
    : 3000;
};

/* const isProd = () => {
  return (
    process.env['NODE_ENV'] !== 'development' &&
    process.env['NODE_ENV'] !== 'test'
  );
}; */

const logger = new Logger('SmartG4-API');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser(process.env['ADMIN_COOKIE_SECRET']));

  app.enableCors({
    origin: '*',
    allowedHeaders:
      'Authorization, Device-Id, User-Agent, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe, X-Csrf-Token, X-Apollo-Operation-Name, Apollo-Require-Preflight',
    exposedHeaders:
      'Authorization, Device-Id, User-Agent, Content-Type, Accept, X-Apollo-Operation-Name, Apollo-Require-Preflight',
    methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
  });

  /* if (isProd()) {
    app.use(doubleCsrfProtection);
  } */

  app.use(
    '/graphql',
    graphqlUploadExpress({ maxFileSize: 52428800, maxFiles: 10 }),
  );

  const port = getPort();
  await app.listen(port).then(() => {
    logger.log(`Started @ ${port}`);
  });
}

export { generateToken, validateRequest };

bootstrap();
