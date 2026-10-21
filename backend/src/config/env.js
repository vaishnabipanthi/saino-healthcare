require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET will be at least 32 characters long'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('\n.env me problem hai:');
  parsed.error.issues.forEach((i) => console.error(' -', i.path.join('.'), ':', i.message));
  process.exit(1);
}

module.exports = parsed.data;