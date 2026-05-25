import 'dotenv/config'
import { app } from './app.js'

const PORT = parseInt(process.env['PORT'] ?? '8080', 10)

app.listen(PORT, () => {
  console.log(`[API] Server running on port ${PORT} (${process.env['NODE_ENV'] ?? 'development'})`)
})
