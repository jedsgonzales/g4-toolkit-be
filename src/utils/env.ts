export const isProd =
  process.env['NODE_ENV'] !== 'development' &&
  process.env['NODE_ENV'] !== 'test';
