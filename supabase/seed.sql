-- =====================================================================
-- SIRSG 2.0 — Contenido inicial de las secciones informativas (RF-01)
-- Ejecutar DESPUÉS de schema.sql, en: Supabase > SQL Editor > New query
--
-- Es un punto de partida: revísalo y ajústalo desde el panel de administración
-- (cada edición crea una versión nueva). Solo inserta las secciones que aún no existen,
-- así que se puede ejecutar varias veces sin duplicar nada.
-- Formato del texto: "## Subtítulo", "- elemento de lista" y línea en blanco entre párrafos.
-- =====================================================================

insert into public.section_versions (slug, title, body, status)
select v.slug, v.title, v.body, 'published'
from (values
  ('quienes-somos', 'Quiénes somos', $$SIRSG 2.0 es el Semillero de Investigación en Ciberseguridad: un grupo de estudiantes y docentes que se reúne para aprender, practicar e investigar sobre seguridad informática más allá del aula.

Creemos que la seguridad se entiende mejor rompiendo y arreglando cosas en entornos controlados. Por eso combinamos la teoría con laboratorios, retos tipo CTF y proyectos reales.

## Qué hacemos
- Reuniones periódicas con charlas, talleres y retos prácticos.
- Laboratorios de seguridad ofensiva y defensiva en entornos aislados y legales.
- Participación en competencias CTF y eventos de la comunidad.
- Proyectos de investigación y divulgación con resultados publicables.
- Material de estudio abierto para todos los integrantes.

## Quiénes pueden participar
El semillero está abierto a estudiantes de todas las carreras y semestres, incluida la sede sur. No necesitas experiencia previa: solo curiosidad, constancia y ganas de compartir lo que aprendes.

## Nuestros valores
- Ética: todo lo que practicamos se hace con autorización y en entornos controlados.
- Colaboración: el conocimiento se comparte; quien aprende algo, lo enseña.
- Curiosidad: preguntamos cómo funcionan las cosas para entender cómo protegerlas.
- Rigor: documentamos, medimos y verificamos lo que investigamos.

## Cómo unirte
- Escríbenos desde la página de contacto con tu nombre, carrera y sede.
- Asiste a una de las reuniones publicadas en la cartelera de eventos.
- Elige una línea de investigación y súmate a un proyecto.$$),

  ('mision-vision', 'Misión y visión', $$## Misión
Formar estudiantes con competencias técnicas y éticas en ciberseguridad mediante la investigación aplicada, la práctica en laboratorios controlados y la divulgación del conocimiento, contribuyendo a una cultura de seguridad digital en la institución y su entorno.

## Visión
Ser un semillero de referencia en ciberseguridad dentro de la institución, reconocido por la calidad de sus proyectos, su participación en competencias y eventos académicos, y por formar profesionales capaces de proteger la información de las organizaciones.

## Objetivos
- Fomentar la investigación en seguridad de la información entre los estudiantes.
- Desarrollar habilidades prácticas con laboratorios, retos CTF y casos reales.
- Promover el uso ético y responsable de las herramientas de seguridad.
- Divulgar buenas prácticas de seguridad digital en la comunidad académica.
- Producir material de estudio, ponencias y artículos a partir de los proyectos.$$),

  ('lineas-investigacion', 'Líneas de investigación', $$Organizamos el trabajo del semillero en líneas. Cada integrante puede elegir la que más le interese y moverse entre ellas.

## Seguridad en aplicaciones web
Análisis de vulnerabilidades comunes (OWASP Top 10), desarrollo seguro y pruebas de penetración sobre aplicaciones de laboratorio.

## Seguridad defensiva y respuesta a incidentes
Endurecimiento (hardening) de sistemas, monitoreo de registros, detección de amenazas y procedimientos de respuesta ante incidentes.

## Pentesting ético y CTF
Metodologías de pruebas de penetración, explotación en entornos controlados y preparación para competencias Capture The Flag.

## Análisis forense y malware
Recolección y análisis de evidencia digital y estudio del comportamiento de software malicioso en entornos aislados.

## Criptografía y redes
Fundamentos criptográficos, protocolos seguros y seguridad en redes y servicios.

## Concienciación y cultura de seguridad
Campañas de divulgación, ingeniería social y buenas prácticas para usuarios no técnicos.$$),

  ('proyectos', 'Proyectos', $$Aquí publicamos los proyectos del semillero: en qué estamos trabajando, qué hemos terminado y qué resultados obtuvimos.

## SIRSG 2.0 — Sitio web del semillero
Este mismo sitio. Lo desarrollamos aplicando prácticas de desarrollo seguro: control de acceso a nivel de base de datos, validaciones en el servidor, protección contra XSS, CAPTCHA anti-spam y bloqueo por intentos fallidos de inicio de sesión.

## Próximos proyectos
- Laboratorio propio de práctica con máquinas vulnerables.
- Banco de retos CTF para los nuevos integrantes.
- Guías de estudio por línea de investigación.

¿Tienes una idea de proyecto? Escríbenos desde la página de contacto.$$)
) as v (slug, title, body)
where not exists (select 1 from public.section_versions s where s.slug = v.slug);
