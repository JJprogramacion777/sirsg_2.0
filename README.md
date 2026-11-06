# SIRSG 2.0

Sitio web del Semillero de Investigación en Ciberseguridad.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase (PostgreSQL, Auth y Storage).

## Modo demo (sin Supabase)

Para probar todo sin crear nada en Supabase:

```bash
npm install
npm run dev
```

Si no existe `.env`, el sitio arranca en **modo demo**:

- Los datos (secciones, eventos, documentos y mensajes) se guardan en el navegador (IndexedDB) y vienen con ejemplos.
- El panel está en `/panel-sirsg/login` y se entra con el correo y la contraseña de `credenciales-admin.txt` (raíz del proyecto, fuera de git). El servidor de desarrollo valida esas credenciales y aplica el bloqueo de 5 intentos; el navegador nunca recibe el archivo.
- Solo existe con `npm run dev`: en `npm run build` el modo demo se sustituye por un módulo vacío (`src/lib/demo/stub.ts`).
- Para empezar de cero, borra los datos del sitio en el navegador (DevTools > Application > IndexedDB > `sirsg-demo`).

## Puesta en marcha

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un proyecto gratis en [supabase.com](https://supabase.com).
3. En **SQL Editor**, pega y ejecuta todo el archivo [`supabase/schema.sql`](supabase/schema.sql). Después ejecuta [`supabase/seed.sql`](supabase/seed.sql), que publica el contenido inicial de Quiénes somos, Misión y visión, Líneas de investigación y Proyectos (luego se edita desde el panel).
4. En **Authentication > Providers > Email**, desactiva *Allow new users to sign up* (solo el admin tiene cuenta).
5. En **Authentication > Users > Add user**, crea el usuario administrador. Luego dale permisos en el SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'correo-del-admin@ejemplo.com';
   ```
6. Crea un widget en [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) (gratis) con tu dominio y `localhost`. Te da una *site key* (pública) y una *secret key*.
7. Publica las Edge Functions del contacto y del login con la [CLI de Supabase](https://supabase.com/docs/guides/cli):
   ```bash
   npx supabase login
   npx supabase link --project-ref <id-del-proyecto>
   npx supabase secrets set TURNSTILE_SECRET_KEY=<secret-key>
   npx supabase functions deploy contact --no-verify-jwt
   npx supabase functions deploy admin-login --no-verify-jwt
   ```
8. Copia `.env.example` como `.env` y rellena la URL, la *anon key* (Project Settings > API) y la *site key* de Turnstile.
9. En **Authentication > Rate Limits**, baja el límite de inicios de sesión por IP (por ejemplo a 10 cada 5 minutos). Ver la nota de RF-11 en Seguridad.
10. Arranca el proyecto:
   ```bash
   npm run dev
   ```

El panel de administración está en la ruta definida en `VITE_ADMIN_PATH` (por ejemplo `/panel-sirsg-xyz/login`).
No hay enlaces públicos hacia él y la página lleva `noindex`.

## Estructura

```
src/
  components/   layout (Navbar, Footer, layouts) y ui (diálogos, paginación…)
  hooks/        sesión, inactividad, carga de datos
  lib/          configuración, cliente Supabase, validaciones
  pages/
    public/     Inicio, Sección, Eventos, Documentos, Contacto
    admin/      Login, Resumen, Secciones, Eventos, Documentos, Mensajes
  services/     acceso a datos por módulo
supabase/
  schema.sql    tablas, RLS, funciones y buckets
  functions/    Edge Functions: contact (RF-08) y admin-login (RF-11)
```

## Requisitos cubiertos

| RF | Dónde |
|----|-------|
| 01, 02 | `pages/public/SectionPage.tsx`, `components/ui/EmptyState.tsx` |
| 03, 04, 05 | `services/events.ts` (`listEvents`), `pages/public/EventsPage.tsx` |
| 06 | `services/documents.ts` (`downloadUrl` con `download`) |
| 07, 08 | `pages/public/ContactPage.tsx`, Edge Function `contact` (CAPTCHA Turnstile), trigger `contact_rate_limit` |
| 09 | Ruta `VITE_ADMIN_PATH` + `hooks/useNoIndex.ts` |
| 10 | Supabase Auth (hash bcrypt en el servidor) |
| 11 | Edge Function `admin-login` + `login_attempts` (5 intentos → 15 min, decidido en el servidor) |
| 12 | `hooks/useIdleLogout.ts` (`VITE_ADMIN_IDLE_MINUTES`) |
| 13 | `AdminLayout` cierra sesión y navega con `replace` |
| 14, 15 | `pages/admin/SectionsAdminPage.tsx`, tabla `section_versions` |
| 16 | `components/ui/ConfirmDialog.tsx` (hay que escribir ELIMINAR) |
| 17, 18, 19 | `pages/admin/EventsAdminPage.tsx`, CHECKs en la tabla `events` |
| 20, 21, 22 | `pages/admin/DocumentsAdminPage.tsx`, límites del bucket `documentos` (sin `.zip`) |

## Seguridad

- **XSS:** todo el contenido se muestra como texto, sin `dangerouslySetInnerHTML`; React lo escapa.
- **Permisos:** Row Level Security en todas las tablas; solo los usuarios de `admins` pueden escribir.
- Las validaciones del navegador se repiten en la base de datos (CHECKs y límites del bucket).
- **Anti-spam (RF-08):** el público no puede insertar en `contact_messages`; los mensajes entran solo por la Edge Function `contact`, que exige un CAPTCHA válido. Además hay honeypot y un máximo de 3 mensajes por correo cada hora.
- **Bloqueo de login (RF-11):** el conteo de intentos y el bloqueo se hacen en la Edge Function `admin-login`, con CAPTCHA; las funciones SQL del bloqueo solo las puede llamar la *service role*.
  Límite conocido: el endpoint de Auth de Supabase (`/auth/v1/token`) sigue siendo público y no pasa por la función. Ahí protege el límite de inicios de sesión por IP de Supabase (paso 9). Usa una contraseña de admin larga y única.
- **Archivos (RF-21):** no se aceptan comprimidos (`.zip`), porque pueden esconder ejecutables.
