import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: 'postgres://demo:demo@localhost:53321/dev_demo',
  },
})