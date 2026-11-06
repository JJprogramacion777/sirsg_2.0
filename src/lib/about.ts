/** Contenido estructurado de la página interactiva "Quiénes somos". */

export const ACTIVITIES = [
  { glyph: '◎', title: 'Reuniones', front: 'Charlas, talleres y retos prácticos.', back: 'Nos vemos de forma periódica, presencial y virtual, para compartir avances y aprender juntos.' },
  { glyph: '⌬', title: 'Laboratorios', front: 'Seguridad ofensiva y defensiva.', back: 'Practicamos en entornos aislados y legales: máquinas vulnerables, redes de prueba y herramientas reales.' },
  { glyph: '⚑', title: 'Competencias CTF', front: 'Retos Capture The Flag.', back: 'Participamos en competencias y eventos de la comunidad para medirnos y aprender bajo presión.' },
  { glyph: '✎', title: 'Investigación', front: 'Proyectos con resultados.', back: 'Cada línea desarrolla proyectos que terminan en ponencias, artículos o herramientas útiles.' },
  { glyph: '⇩', title: 'Material abierto', front: 'Guías y recursos para todos.', back: 'Lo que aprendemos lo documentamos y lo compartimos en la sección de documentos.' },
] as const

export const VALUES = [
  { title: 'Ética', text: 'Todo lo que practicamos se hace con autorización y en entornos controlados.', color: '#22d3a6' },
  { title: 'Colaboración', text: 'El conocimiento se comparte: quien aprende algo, lo enseña.', color: '#38bdf8' },
  { title: 'Curiosidad', text: 'Preguntamos cómo funcionan las cosas para entender cómo protegerlas.', color: '#a78bfa' },
  { title: 'Rigor', text: 'Documentamos, medimos y verificamos lo que investigamos.', color: '#f59e0b' },
] as const

export const JOIN_STEPS = [
  { title: 'Escríbenos', text: 'Llena el formulario de inscripción con tu nombre, carrera y sede.', to: '/contacto', cta: 'Ir al formulario' },
  { title: 'Ven a una reunión', text: 'Revisa la cartelera y acompáñanos en la próxima sesión.', to: '/eventos', cta: 'Ver la cartelera' },
  { title: 'Elige tu línea', text: 'Haz el test y súmate a la línea que más te guste.', to: '/seccion/lineas-investigacion', cta: 'Hacer el test' },
  { title: 'Construye y comparte', text: 'Participa en un proyecto, resuelve retos y enseña lo que aprendas.', to: '/seccion/proyectos', cta: 'Ver proyectos' },
] as const

/** Respuestas de la terminal interactiva. */
export const TERMINAL_COMMANDS: Record<string, { help: string; output: string[] }> = {
  whoami: { help: 'quiénes somos', output: ['SIRSG 2.0 — Semillero de Investigación en Ciberseguridad', 'Universidad ECCI · estudiantes y docentes que aprenden haciendo.'] },
  mision: { help: 'nuestra misión', output: ['Formar estudiantes con competencias técnicas y éticas en ciberseguridad', 'mediante investigación aplicada, laboratorios y divulgación.'] },
  valores: { help: 'en qué creemos', output: ['[✓] ética', '[✓] colaboración', '[✓] curiosidad', '[✓] rigor'] },
  requisitos: { help: '¿qué necesito?', output: ['experiencia previa ....... no requerida', 'carrera .................. cualquiera', 'sede ..................... todas, incluida la sede sur', 'actitud .................. curiosidad y constancia'] },
  unirse: { help: 'cómo inscribirte', output: ['1. completa el formulario en /contacto', '2. ven a una reunión', '3. elige tu línea de investigación', '→ escribe "ir contacto" para abrir el formulario'] },
  lineas: { help: 'líneas de investigación', output: ['web · defensa · pentesting · forense · criptografía · cultura', '→ escribe "ir lineas" para explorarlas'] },
}
