import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Pin the upstream source so development and production use the same editor.
const revision = 'cfd66e88743351816b29822f5c12a0363c309554'
const root = fileURLToPath(new URL('../', import.meta.url))
const source = resolve(root, 'node_modules/.cache/klecks-source')
const output = resolve(root, 'public/klecks')
const stamp = resolve(output, 'revision.txt')
if (existsSync(stamp) && readFileSync(stamp, 'utf8') === revision && existsSync(resolve(output, 'embed.js'))) {
  process.exit(0)
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, stdio: 'inherit', shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`)
}

if (!existsSync(resolve(source, '.git'))) {
  mkdirSync(resolve(root, 'node_modules/.cache'), { recursive: true })
  run('git', ['clone', '--depth', '1', '--no-checkout', 'https://github.com/bitbof/klecks.git', 'node_modules/.cache/klecks-source'])
}
run('git', ['fetch', '--depth', '1', 'origin', revision], source)
run('git', ['checkout', '--detach', revision], source)
run('npm', ['ci', '--no-audit', '--no-fund'], source)
run('npm', ['run', 'icon:build'], source)
run('npm', ['run', 'lang:build'], source)
run('npm', ['run', 'build:embed'], source)
mkdirSync(output, { recursive: true })
cpSync(resolve(source, 'dist'), output, { recursive: true })
cpSync(resolve(source, 'LICENSE'), resolve(output, 'LICENSE.txt'))
writeFileSync(stamp, revision)
