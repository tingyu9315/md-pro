import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const dist = path.resolve('dist')
if (!fs.existsSync(dist)) process.exit(0)
try {
  execSync(`cd ${dist} && zip -qr ../md-pro.zip .`, { stdio: 'inherit' })
} catch (e) {
  console.error('zip failed', e)
  process.exit(1)
}