import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/model/schema.sqlite.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DB_PATH || './db.sqlite',
  },
})
