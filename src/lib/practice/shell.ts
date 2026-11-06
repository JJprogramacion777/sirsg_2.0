// Intérprete de comandos del Kali Lab. Simula un puñado de comandos sobre un
// sistema de archivos en memoria; nunca ejecuta nada en el equipo del visitante.
import { type FileSystem, HOME, WEB } from './missions'

export type LineKind = 'out' | 'err' | 'info' | 'ok' | 'dir'
export interface Line {
  kind: LineKind
  text: string
}

export interface ShellState {
  cwd: string
  fs: FileSystem
}

const out = (text: string, kind: LineKind = 'out'): Line => ({ kind, text })
const err = (text: string): Line => ({ kind: 'err', text })

export const COMMANDS = ['ls', 'cd', 'pwd', 'cat', 'grep', 'find', 'whoami', 'id', 'uname', 'hostname', 'echo', 'date', 'nmap', 'curl', 'ping', 'base64', 'clear', 'help', 'history']

export function resolvePath(cwd: string, arg = '.') {
  const raw = arg.startsWith('~') ? HOME + arg.slice(1) : arg.startsWith('/') ? arg : `${cwd}/${arg}`
  const parts: string[] = []
  for (const p of raw.split('/')) {
    if (!p || p === '.') continue
    if (p === '..') parts.pop()
    else parts.push(p)
  }
  return '/' + parts.join('/')
}

export function prettyPath(path: string) {
  return path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path
}

export function children(fs: FileSystem, dir: string) {
  const prefix = dir === '/' ? '/' : dir + '/'
  return Object.keys(fs)
    .filter((p) => p !== dir && p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
    .map((p) => p.slice(prefix.length))
    .sort()
}

function readFile(state: ShellState, arg: string | undefined): string | Line {
  if (!arg) return err('falta el nombre del archivo')
  const path = resolvePath(state.cwd, arg)
  const node = state.fs[path]
  if (!node) return err(`${arg}: No existe el archivo o el directorio`)
  if (node.type === 'dir') return err(`${arg}: Es un directorio`)
  return node.content
}

function wildcard(pattern: string) {
  const esc = pattern.replace(/["']/g, '').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${esc}$`)
}

function grepLines(text: string, pattern: string, ignoreCase: boolean) {
  const p = pattern.replace(/^["']|["']$/g, '')
  const needle = ignoreCase ? p.toLowerCase() : p
  return text.split('\n').filter((l) => (ignoreCase ? l.toLowerCase() : l).includes(needle))
}

const HELP = [
  'Comandos de Linux disponibles en el laboratorio:',
  '  ls [-a] [-l] [ruta]     lista archivos (-a muestra ocultos)',
  '  cd <ruta>               cambia de carpeta (cd .. sube un nivel)',
  '  pwd                     muestra dónde estás',
  '  cat <archivo>           muestra el contenido',
  '  grep [-i] <texto> <arch> busca líneas que contengan el texto',
  '  find <ruta> -name <x>   busca archivos por nombre (admite *)',
  '  nmap <ip>               escanea puertos (simulado)',
  '  curl <url>              pide una página web (simulado)',
  '  base64 -d <archivo>     decodifica Base64',
  '  whoami, id, uname -a, ping, echo, history, clear',
  'Puedes encadenar con |, por ejemplo: cat archivo | grep texto',
  'Usa la tecla Tab para autocompletar y ↑ ↓ para el historial.',
]

export interface RunResult {
  lines: Line[]
  clear?: boolean
  /**
   * Lo que hizo el jugador, para las pistas en tiempo real. Ej.: "read:/var/log/auth.log",
   * "nmap:10.10.10.5", "curl:http://10.10.10.5/robots.txt", "unknown:lss".
   */
  events: string[]
}

/** Ejecuta una línea (admite un | hacia grep). Devuelve las líneas a mostrar. */
export function run(state: ShellState, input: string, history: string[]): RunResult {
  const [left, ...pipes] = input.split('|').map((s) => s.trim())
  const events: string[] = []
  let result: RunResult = { ...exec(state, left, history, events), events }
  for (const pipe of pipes) {
    const [cmd, ...args] = pipe.split(/\s+/)
    if (cmd !== 'grep') return { lines: [err(`la tubería solo admite grep en este laboratorio`)], events: [...events, 'err:pipe'] }
    const ignore = args[0] === '-i'
    const pattern = ignore ? args[1] : args[0]
    if (!pattern) return { lines: [err('grep: falta el texto a buscar')], events }
    events.push(`grep:${pattern.replace(/["']/g, '')}`)
    const text = result.lines.filter((l) => l.kind !== 'err').map((l) => l.text).join('\n')
    result = { lines: grepLines(text, pattern, ignore).map((t) => out(t)), events }
  }
  return result
}

function exec(state: ShellState, input: string, history: string[], ev: string[]): { lines: Line[]; clear?: boolean } {
  const tokens = input.match(/"[^"]*"|'[^']*'|\S+/g) ?? []
  const [cmd, ...args] = tokens
  const flags = args.filter((a) => a.startsWith('-')).join('')
  const plain = args.filter((a) => !a.startsWith('-'))

  switch (cmd) {
    case undefined:
      return { lines: [] }
    case 'help':
      return { lines: HELP.map((t) => out(t, 'info')) }
    case 'clear':
      return { lines: [], clear: true }
    case 'whoami':
      ev.push('whoami')
      return { lines: [out('kali')] }
    case 'id':
      return { lines: [out('uid=1000(kali) gid=1000(kali) grupos=1000(kali),27(sudo)')] }
    case 'hostname':
      return { lines: [out('sirsg')] }
    case 'uname':
      return { lines: [out(flags.includes('a') ? 'Linux sirsg 6.8.0-kali1-amd64 #1 SMP x86_64 GNU/Linux' : 'Linux')] }
    case 'date':
      return { lines: [out(new Date().toLocaleString('es-CO'))] }
    case 'pwd':
      ev.push('pwd')
      return { lines: [out(state.cwd)] }
    case 'echo':
      return { lines: [out(args.join(' ').replace(/["']/g, ''))] }
    case 'history':
      return { lines: history.map((h, i) => out(`${String(i + 1).padStart(4)}  ${h}`)) }

    case 'ls': {
      const path = resolvePath(state.cwd, plain[0])
      const node = state.fs[path]
      if (!node) ev.push(`err:ls:${plain[0]}`)
      else ev.push(`ls:${path}`, ...(flags.includes('a') ? [`lsa:${path}`] : []))
      if (!node) return { lines: [err(`ls: no se puede acceder a '${plain[0]}': No existe el archivo o el directorio`)] }
      if (node.type === 'file') return { lines: [out(plain[0])] }
      const names = children(state.fs, path).filter((n) => flags.includes('a') || !n.startsWith('.'))
      const all = flags.includes('a') ? ['.', '..', ...names] : names
      if (flags.includes('l')) {
        return {
          lines: all.map((n) => {
            const child = state.fs[resolvePath(path, n)]
            const isDir = n === '.' || n === '..' || child?.type === 'dir'
            const size = child?.type === 'file' ? child.content.length : 4096
            return out(`${isDir ? 'drwxr-xr-x' : '-rw-r--r--'} 1 kali kali ${String(size).padStart(5)} nov  4 ${n}`, isDir ? 'dir' : 'out')
          }),
        }
      }
      return { lines: all.length ? [{ kind: 'dir', text: all.map((n) => (state.fs[resolvePath(path, n)]?.type === 'dir' || n === '.' || n === '..' ? `${n}/` : n)).join('   ') }] : [] }
    }

    case 'cd': {
      const path = resolvePath(state.cwd, plain[0] ?? '~')
      const node = state.fs[path]
      if (!node || node.type !== 'dir') ev.push(`err:cd:${plain[0]}`)
      if (!node) return { lines: [err(`cd: ${plain[0]}: No existe el archivo o el directorio`)] }
      if (node.type !== 'dir') return { lines: [err(`cd: ${plain[0]}: No es un directorio`)] }
      state.cwd = path
      ev.push(`cd:${path}`)
      return { lines: [] }
    }

    case 'cat': {
      if (!plain.length) return { lines: [err('cat: falta el nombre del archivo')] }
      const lines: Line[] = []
      for (const f of plain) {
        const r = readFile(state, f)
        ev.push(typeof r === 'string' ? `read:${resolvePath(state.cwd, f)}` : `err:cat:${f}`)
        if (typeof r === 'string') lines.push(...r.split('\n').map((t) => out(t)))
        else lines.push(err(`cat: ${r.text}`))
      }
      return { lines }
    }

    case 'grep': {
      const [pattern, file] = plain
      if (!pattern || !file) return { lines: [err('uso: grep [-i] <texto> <archivo>')] }
      const r = readFile(state, file)
      if (typeof r !== 'string') {
        ev.push(`err:grep:${file}`)
        return { lines: [err(`grep: ${r.text}`)] }
      }
      ev.push(`read:${resolvePath(state.cwd, file)}`, `grep:${pattern.replace(/["']/g, '')}`)
      return { lines: grepLines(r, pattern, flags.includes('i')).map((t) => out(t)) }
    }

    case 'find': {
      const start = resolvePath(state.cwd, plain[0] && plain[0] !== '-name' ? plain[0] : '.')
      const nameIdx = args.indexOf('-name')
      const re = nameIdx >= 0 && args[nameIdx + 1] ? wildcard(args[nameIdx + 1]) : null
      const prefix = start === '/' ? '/' : start + '/'
      const found = Object.keys(state.fs)
        .filter((p) => p === start || p.startsWith(prefix))
        .filter((p) => !re || re.test(p.split('/').pop() ?? ''))
        .sort()
      const base = plain[0] && plain[0] !== '-name' ? plain[0] : '.'
      ev.push(`find:${nameIdx >= 0 ? (args[nameIdx + 1] ?? '') : '*'}`.replace(/["']/g, ''), ...found.map((p) => `found:${p}`))
      return { lines: found.map((p) => out(base === '.' && p.startsWith(state.cwd) ? '.' + p.slice(state.cwd.length) : p)) }
    }

    case 'base64': {
      if (!flags.includes('d')) return { lines: [err('usa base64 -d <archivo> para decodificar')] }
      const r = readFile(state, plain[0])
      if (typeof r !== 'string') {
        ev.push(`err:base64:${plain[0]}`)
        return { lines: [err(`base64: ${r.text}`)] }
      }
      ev.push(`b64:${resolvePath(state.cwd, plain[0])}`)
      try {
        return { lines: [out(atob(r.trim()))] }
      } catch {
        return { lines: [err('base64: entrada no válida')] }
      }
    }

    case 'ping': {
      const host = plain[0]
      if (!host) return { lines: [err('ping: falta el destino')] }
      if (host !== '10.10.10.5') return { lines: [err(`ping: ${host}: Host desconocido o sin respuesta`)] }
      return { lines: [out(`PING ${host} 56(84) bytes de datos.`), ...[1, 2, 3].map((i) => out(`64 bytes desde ${host}: icmp_seq=${i} ttl=64 tiempo=0.${40 + i} ms`)), out('--- 3 paquetes transmitidos, 3 recibidos, 0% pérdida ---')] }
    }

    case 'nmap': {
      const host = plain[0]
      if (!host) return { lines: [err('uso: nmap <ip>')] }
      ev.push(`nmap:${host}`)
      if (host !== '10.10.10.5') return { lines: [out(`Starting Nmap 7.94 ( https://nmap.org )`), out(`Note: Host seems down. (${host})`, 'err')] }
      return {
        lines: [
          out('Starting Nmap 7.94 ( https://nmap.org )'),
          out('Nmap scan report for 10.10.10.5'),
          out('Host is up (0.00042s latency).'),
          out('PORT     STATE SERVICE'),
          out('22/tcp   open  ssh'),
          out('80/tcp   open  http'),
          out('8080/tcp open  http-proxy', 'ok'),
          out('Nmap done: 1 IP address (1 host up) scanned in 0.84 seconds'),
        ],
      }
    }

    case 'curl': {
      const raw = plain[0]
      if (!raw) return { lines: [err('uso: curl <url>')] }
      const url = (raw.startsWith('http') ? raw : `http://${raw}`).replace(/\/$/, '').replace(':80/', '/').replace(/:80$/, '')
      const page = WEB[url]
      ev.push(page ? `curl:${url}` : `curl404:${url}`)
      if (!page) return { lines: [err(url.includes('10.10.10.5') ? '404 Not Found' : `curl: (6) No se pudo resolver el host: ${raw}`)] }
      return { lines: page.split('\n').map((t) => out(t)) }
    }

    case 'sudo':
      return { lines: [err('[sudo] buen intento 😉 en este laboratorio no necesitas ser root.')] }
    case 'rm':
      return { lines: [err('rm: en el laboratorio no se borra nada. Sigue investigando.')] }
    case 'exit':
      return { lines: [out('No hay salida: aún quedan banderas por encontrar.', 'info')] }
    default:
      ev.push(`unknown:${cmd}`)
      return { lines: [err(`${cmd}: orden no encontrada. Escribe "help".`)] }
  }
}

/** Autocompleta la última palabra con comandos o archivos de la carpeta actual. */
export function complete(state: ShellState, input: string) {
  const parts = input.split(' ')
  const last = parts[parts.length - 1]
  if (parts.length === 1) {
    const matches = [...COMMANDS, 'mision', 'pista', 'enviar'].filter((c) => c.startsWith(last))
    return matches.length === 1 ? matches[0] + ' ' : input
  }
  const slash = last.lastIndexOf('/')
  const dirPart = slash >= 0 ? last.slice(0, slash + 1) : ''
  const namePart = slash >= 0 ? last.slice(slash + 1) : last
  const dir = resolvePath(state.cwd, dirPart || '.')
  const matches = children(state.fs, dir).filter((n) => n.startsWith(namePart) && (namePart.startsWith('.') || !n.startsWith('.')))
  if (matches.length !== 1) return input
  const full = resolvePath(dir, matches[0])
  parts[parts.length - 1] = dirPart + matches[0] + (state.fs[full]?.type === 'dir' ? '/' : '')
  return parts.join(' ')
}
