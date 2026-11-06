import * as demo from '@demo'
import { IS_DEMO } from '../lib/mode'
import { supabase } from '../lib/supabase'
import type { PublishStatus, SectionVersion } from '../types'

/** Secciones fijas que aparecen en el menú público. El admin puede crear más. */
export const PUBLIC_SECTIONS = [
  { slug: 'quienes-somos', label: 'Quiénes somos' },
  { slug: 'mision-vision', label: 'Misión y visión' },
  { slug: 'lineas-investigacion', label: 'Líneas de investigación' },
  { slug: 'proyectos', label: 'Proyectos' },
] as const

/** RF-01: última versión publicada de una sección; null si no existe (RF-02). */
export async function getPublishedSection(slug: string) {
  if (IS_DEMO) return demo.getPublishedSection(slug)
  const { data, error } = await supabase
    .from('section_versions')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as SectionVersion | null
}

/** Admin: la versión más reciente de cada sección (borrador o publicada). */
export async function listLatestSections() {
  if (IS_DEMO) return demo.listLatestSections()
  const { data, error } = await supabase
    .from('section_versions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  const latest = new Map<string, SectionVersion>()
  for (const row of data as SectionVersion[]) {
    if (!latest.has(row.slug)) latest.set(row.slug, row)
  }
  return [...latest.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

export interface SectionInput {
  slug: string
  title: string
  body: string
  image_url: string | null
  status: PublishStatus
}

/** Guardar siempre crea una versión nueva, así nunca se pierde lo publicado (RF-15). */
export async function saveSection(input: SectionInput) {
  if (IS_DEMO) return demo.saveSection(input)
  const { error } = await supabase.from('section_versions').insert(input)
  if (error) throw error
}

export async function deleteSection(slug: string) {
  if (IS_DEMO) return demo.deleteSection(slug)
  const { error } = await supabase.from('section_versions').delete().eq('slug', slug)
  if (error) throw error
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
