import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: 'mysql://demo:demo@localhost:3307/dev_demo',
  },
})