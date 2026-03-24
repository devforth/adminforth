import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

console.log('SQLITE_FILE_URL =', process.env.SQLITE_FILE_URL)

export default defineConfig({
  datasource: {
    url: env('SQLITE_FILE_URL'),
  },
})