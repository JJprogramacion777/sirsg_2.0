// Kali Lab: misiones, sistema de archivos simulado y calificación.
// Todo ocurre en el navegador; ningún comando se ejecuta de verdad.

export interface FsDir {
  type: 'dir'
}
export interface FsFile {
  type: 'file'
  content: string
}
export type FsNode = FsDir | FsFile
export type FileSystem = Record<string, FsNode>

export const HOME = '/home/kali'

/** Lo que el jugador ha hecho en la terminal; con esto se marcan los pasos en tiempo real. */
export interface PlayerContext {
  /** Eventos del intérprete: "read:/ruta", "nmap:ip", "curl:url", "lsa:/ruta"… */
  events: Set<string>
  /** Banderas que ya aparecieron en pantalla. */
  flagsSeen: Set<string>
  cwd: string
}

export interface MissionStep {
  /** Lo que se ve en la lista de progreso (no revela el comando). */
  label: string
  /** Pista para este paso (resta puntos). */
  hint: string
  done: (ctx: PlayerContext) => boolean
}

export interface Mission {
  id: string
  /** Línea de investigación relacionada (ver src/lib/research.ts). */
  line: string
  title: string
  story: string
  objective: string
  /** Pasos en orden; el último siempre es enviar la bandera. */
  steps: MissionStep[]
  flag: string
  /** Comandos que se aprenden en la misión. */
  skills: string[]
}

export const POINTS_PER_MISSION = 100
export const HINT_PENALTY = 25

const has = (ctx: PlayerContext, prefix: string) => [...ctx.events].some((e) => e.startsWith(prefix))
const saw = (flag: string) => (ctx: PlayerContext) => ctx.flagsSeen.has(flag)

/** Paso final común: enviar la bandera (se marca al completar la misión). */
const submitStep = (flag: string): MissionStep => ({
  label: 'Envía la bandera',
  hint: `Copia la bandera tal cual y escribe: enviar ${flag.slice(0, 5)}…}`,
  done: () => false,
})

const M1 = 'FLAG{hola_kali}'
const M2 = 'FLAG{archivos_ocultos}'
const M3 = 'FLAG{grep_es_tu_amigo}'
const M4 = 'FLAG{puerto_8080_abierto}'
const M5 = 'FLAG{base64_no_es_cifrado}'
const M6 = 'FLAG{robots_txt_revela}'

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    line: 'cultura',
    title: 'Primeros pasos',
    story: 'Acabas de entrar a una máquina Kali del laboratorio.',
    objective: 'Descubre quién eres, dónde estás y lee el archivo de bienvenida de tu carpeta personal.',
    steps: [
      { label: 'Averigua con qué usuario entraste', hint: 'Escribe whoami: te dice tu nombre de usuario.', done: (c) => has(c, 'whoami') },
      { label: 'Mira qué archivos hay en tu carpeta', hint: 'Escribe ls para listar los archivos de la carpeta actual.', done: (c) => c.events.has(`ls:${HOME}`) },
      { label: 'Lee el archivo de bienvenida', hint: 'Viste bienvenida.txt. Léelo con: cat bienvenida.txt', done: saw(M1) },
      submitStep(M1),
    ],
    flag: M1,
    skills: ['whoami', 'pwd', 'ls', 'cat'],
  },
  {
    id: 'm2',
    line: 'forense',
    title: 'Lo que no se ve',
    story: 'Un compañero dejó algo escondido en la carpeta mision2.',
    objective: 'Entra a mision2 y encuentra el archivo oculto.',
    steps: [
      { label: 'Entra a la carpeta mision2', hint: 'Cámbiate de carpeta con: cd mision2 (si te perdiste, vuelve con cd ~).', done: (c) => c.cwd === `${HOME}/mision2` || c.events.has(`ls:${HOME}/mision2`) },
      { label: 'Descubre los archivos ocultos', hint: 'ls no muestra los archivos que empiezan por punto. Usa: ls -a', done: (c) => c.events.has(`lsa:${HOME}/mision2`) || c.events.has(`found:${HOME}/mision2/.secreto`) },
      { label: 'Lee el archivo oculto', hint: 'Apareció .secreto. Léelo con: cat .secreto', done: saw(M2) },
      submitStep(M2),
    ],
    flag: M2,
    skills: ['cd', 'ls -a'],
  },
  {
    id: 'm3',
    line: 'defensa',
    title: 'Aguja en el pajar',
    story: 'El servidor registró cientos de intentos de inicio de sesión esta noche.',
    objective: 'Encuentra la ALERTA de acceso sospechoso dentro de /var/log/auth.log.',
    steps: [
      { label: 'Abre el registro de autenticación', hint: 'Los registros del sistema están en /var/log. Prueba: cat /var/log/auth.log', done: (c) => c.events.has('read:/var/log/auth.log') },
      { label: 'Filtra solo la línea de la alerta', hint: 'Son demasiadas líneas para leerlas. Filtra con: grep ALERTA /var/log/auth.log', done: saw(M3) },
      submitStep(M3),
    ],
    flag: M3,
    skills: ['grep', 'cat | grep'],
  },
  {
    id: 'm4',
    line: 'pentesting',
    title: 'Reconocimiento',
    story: 'Tienes autorización para auditar el servidor de laboratorio 10.10.10.5.',
    objective: 'Escanea sus puertos y revisa el servicio web que no debería estar abierto.',
    steps: [
      { label: 'Descubre qué puertos tiene abiertos el servidor', hint: 'Escanea el servidor con: nmap 10.10.10.5', done: (c) => c.events.has('nmap:10.10.10.5') },
      { label: 'Visita el servicio web sospechoso', hint: 'nmap mostró el puerto 8080 abierto. Visítalo con: curl http://10.10.10.5:8080', done: saw(M4) },
      submitStep(M4),
    ],
    flag: M4,
    skills: ['nmap', 'curl'],
  },
  {
    id: 'm5',
    line: 'cripto',
    title: 'Mensaje codificado',
    story: 'Interceptamos un mensaje extraño en la carpeta mision5.',
    objective: 'Decodifica el contenido de mensaje.b64.',
    steps: [
      { label: 'Encuentra el archivo del mensaje', hint: 'Búscalo por extensión desde tu carpeta: find ~ -name "*.b64"', done: (c) => c.events.has(`found:${HOME}/mision5/mensaje.b64`) || c.events.has(`ls:${HOME}/mision5`) || has(c, `read:${HOME}/mision5/mensaje.b64`) || has(c, 'b64:') },
      { label: 'Mira qué tiene adentro', hint: 'Ábrelo con: cat ~/mision5/mensaje.b64 (verás letras sin sentido: es Base64).', done: (c) => c.events.has(`read:${HOME}/mision5/mensaje.b64`) || has(c, 'b64:') },
      { label: 'Decodifícalo', hint: 'Base64 se revierte sin clave: base64 -d ~/mision5/mensaje.b64', done: saw(M5) },
      submitStep(M5),
    ],
    flag: M5,
    skills: ['find', 'base64 -d'],
  },
  {
    id: 'm6',
    line: 'web',
    title: 'Rutas prohibidas',
    story: 'La intranet de 10.10.10.5 esconde una página de administración.',
    objective: 'Revisa el robots.txt del sitio web y visita la ruta que intenta ocultar.',
    steps: [
      { label: 'Visita la página principal de la intranet', hint: 'Abre la web y lee el comentario HTML: curl http://10.10.10.5', done: (c) => c.events.has('curl:http://10.10.10.5') || c.events.has('curl:http://10.10.10.5/robots.txt') },
      { label: 'Lee el archivo robots.txt', hint: 'Los sitios declaran rutas "prohibidas" ahí: curl http://10.10.10.5/robots.txt', done: (c) => c.events.has('curl:http://10.10.10.5/robots.txt') },
      { label: 'Visita la ruta que intentan ocultar', hint: 'robots.txt dice Disallow: /admin-secreto. Visítala: curl http://10.10.10.5/admin-secreto', done: saw(M6) },
      submitStep(M6),
    ],
    flag: M6,
    skills: ['curl', 'robots.txt'],
  },
]

/**
 * Paso en el que va el jugador: el primero sin hacer después del último que ya hizo
 * (así, si se salta pasos, la pista no lo devuelve atrás).
 */
export function currentStep(m: Mission, ctx: PlayerContext, completed: boolean) {
  if (completed) return m.steps.length
  const states = m.steps.map((s) => s.done(ctx))
  const lastDone = states.lastIndexOf(true)
  const next = states.findIndex((d, i) => !d && i > lastDone)
  return next === -1 ? m.steps.length - 1 : next
}

/** Cuántos pasos lleva hechos (para elegir automáticamente la misión activa). */
export function stepsDone(m: Mission, ctx: PlayerContext) {
  return m.steps.filter((s) => s.done(ctx)).length
}

export const MAX_SCORE = MISSIONS.length * POINTS_PER_MISSION

function authLog() {
  const lines: string[] = []
  const users = ['root', 'admin', 'test', 'oracle', 'pi', 'ubuntu']
  for (let i = 0; i < 48; i++) {
    const min = String(i % 60).padStart(2, '0')
    const ip = `198.51.100.${(i * 7) % 250}`
    lines.push(`Nov  4 03:${min}:${String((i * 13) % 60).padStart(2, '0')} sirsg sshd[${1000 + i}]: Failed password for ${users[i % users.length]} from ${ip} port ${40000 + i} ssh2`)
    if (i === 31) lines.push('Nov  4 03:31:44 sirsg sshd[1337]: ALERTA acceso sospechoso aceptado desde 203.0.113.66 -> FLAG{grep_es_tu_amigo}')
    if (i % 9 === 0) lines.push(`Nov  4 03:${min}:59 sirsg sshd[${2000 + i}]: Accepted publickey for kali from 10.0.0.2 port 51122 ssh2`)
  }
  return lines.join('\n')
}

/** Sistema de archivos inicial; cada partida trabaja sobre una copia. */
export function createFileSystem(): FileSystem {
  return {
    '/': { type: 'dir' },
    '/home': { type: 'dir' },
    [HOME]: { type: 'dir' },
    [`${HOME}/bienvenida.txt`]: {
      type: 'file',
      content: 'Bienvenido al Kali Lab de SIRSG 2.0.\nTodo lo que hagas aquí es una simulación segura.\n\nTu primera bandera: FLAG{hola_kali}\nEnvíala con: enviar FLAG{hola_kali}',
    },
    [`${HOME}/LEEME.txt`]: { type: 'file', content: 'Comandos del juego:\n  mision   muestra el objetivo actual\n  pista    pide una pista (resta 25 puntos)\n  enviar   envía una bandera, ej. enviar FLAG{...}\n  help     lista los comandos de Linux disponibles' },
    [`${HOME}/mision2`]: { type: 'dir' },
    [`${HOME}/mision2/notas.txt`]: { type: 'file', content: 'Aquí no hay nada… o tal vez sí.\nEn Linux, los archivos que empiezan por punto no aparecen con ls.' },
    [`${HOME}/mision2/.secreto`]: { type: 'file', content: 'Bien visto. Los archivos ocultos son un clásico en análisis forense.\nFLAG{archivos_ocultos}' },
    [`${HOME}/mision4`]: { type: 'dir' },
    [`${HOME}/mision4/objetivo.txt`]: { type: 'file', content: 'Servidor autorizado para la auditoría: 10.10.10.5\nPrimero descubre qué puertos tiene abiertos.' },
    [`${HOME}/mision5`]: { type: 'dir' },
    [`${HOME}/mision5/mensaje.b64`]: { type: 'file', content: btoa('Mensaje recibido. FLAG{base64_no_es_cifrado}') },
    '/var': { type: 'dir' },
    '/var/log': { type: 'dir' },
    '/var/log/auth.log': { type: 'file', content: authLog() },
    '/etc': { type: 'dir' },
    '/etc/hostname': { type: 'file', content: 'sirsg' },
    '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash' },
  }
}

/** Respuestas del servidor web simulado (para curl). */
export const WEB: Record<string, string> = {
  'http://10.10.10.5': '<html>\n  <h1>Intranet SIRSG</h1>\n  <p>Acceso solo para personal autorizado.</p>\n  <!-- TODO: revisar qué publicamos en robots.txt -->\n</html>',
  'http://10.10.10.5/robots.txt': 'User-agent: *\nDisallow: /admin-secreto',
  'http://10.10.10.5/admin-secreto': '<html>\n  <h1>Panel de administración</h1>\n  <p>Esta ruta no debería ser pública.</p>\n  <p>FLAG{robots_txt_revela}</p>\n</html>',
  'http://10.10.10.5:8080': '<html>\n  <h1>Servidor de pruebas</h1>\n  <!-- Alguien olvidó cerrar este puerto: FLAG{puerto_8080_abierto} -->\n</html>',
}

// ------------------------------- Calificación -------------------------------

export interface MissionResult {
  id: string
  completed: boolean
  hints: number
  /** Banderas incorrectas enviadas en esta misión. */
  wrong: number
  points: number
}

export function missionPoints(completed: boolean, hints: number) {
  return completed ? Math.max(25, POINTS_PER_MISSION - hints * HINT_PENALTY) : 0
}

export function gradeFor(score: number) {
  const pct = (score / MAX_SCORE) * 100
  if (pct >= 90) return { letter: 'A', label: 'Excelente' }
  if (pct >= 75) return { letter: 'B', label: 'Muy bien' }
  if (pct >= 50) return { letter: 'C', label: 'Bien' }
  return { letter: 'D', label: 'En progreso' }
}

const LINE_NAMES: Record<string, string> = {
  cultura: 'Cultura de seguridad',
  forense: 'Forense y malware',
  defensa: 'Defensa y respuesta',
  pentesting: 'Pentesting y CTF',
  cripto: 'Criptografía y redes',
  web: 'Seguridad web',
}

/** Recomendación en texto según las misiones mejor y peor resueltas. */
export function recommendationFor(results: MissionResult[]) {
  const done = results.filter((r) => r.completed)
  if (!done.length) return 'Empieza por los comandos básicos (ls, cd, cat) y vuelve a intentarlo. La línea de Cultura de seguridad es un buen punto de partida.'
  // A igual puntaje gana la misión más avanzada (las últimas son más difíciles).
  const order = (r: MissionResult) => MISSIONS.findIndex((m) => m.id === r.id)
  const best = [...done].sort((a, b) => b.points - a.points || a.wrong - b.wrong || order(b) - order(a))[0]
  const weak = results.filter((r) => !r.completed || r.hints > 0)
  const bestLine = LINE_NAMES[MISSIONS.find((m) => m.id === best.id)!.line]
  const toReview = weak.map((r) => MISSIONS.find((m) => m.id === r.id)!.skills[0])
  return toReview.length
    ? `Tu fuerte: ${bestLine}. Te recomendamos esa línea. Repasa: ${[...new Set(toReview)].join(', ')}.`
    : `Resolviste todo sin pistas. Tu fuerte: ${bestLine}; prueba los retos de Pentesting y CTF.`
}
