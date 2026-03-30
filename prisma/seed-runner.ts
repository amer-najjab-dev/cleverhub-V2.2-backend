import 'dotenv/config'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function run() {
  console.log('🚀 Ejecutando seed con variables de entorno cargadas...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'))
  
  try {
    const { stdout, stderr } = await execAsync('npx ts-node prisma/seed.ts', {
      env: { ...process.env, NODE_ENV: 'development' }
    })
    console.log(stdout)
    if (stderr) console.error(stderr)
  } catch (error: any) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

run()
