import * as demo from '@demo'
import { IS_DEMO } from '../lib/mode'
import { DOCUMENTS_BUCKET, IMAGES_BUCKET, supabase } from '../lib/supabase'
import { fileExtension, validateUpload } from '../lib/validators'
import type { SirsgDocument } from '../types'

export async function listDocuments() {
  if (IS_DEMO) return demo.listDocuments()
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as SirsgDocument[]
}

/** RF-06: el parámetro download hace que Supabase envíe Content-Disposition: attachment. */
export function downloadUrl(doc: SirsgDocument) {
  if (IS_DEMO) return demo.downloadUrl(doc)
  return supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(doc.path, { download: doc.name }).data.publicUrl
}

/** RF-20, RF-21, RF-22. El bucket también limita tamaño y tipo en el servidor. */
export async function uploadDocument(file: File) {
  const problem = validateUpload(file)
  if (problem) throw new Error(problem)

  const path = `${crypto.randomUUID()}.${fileExtension(file.name)}`
  if (IS_DEMO) return demo.uploadDocument(file, path)
  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { error } = await supabase.from('documents').insert({ name: file.name, path, size_bytes: file.size })
  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
    throw error
  }
}

export async function deleteDocument(doc: SirsgDocument) {
  if (IS_DEMO) return demo.deleteDocument(doc)
  const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.path])
  if (storageError) throw storageError
  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw error
}

/** Imágenes de las secciones informativas (RF-14). */
export async function uploadSectionImage(file: File) {
  const ext = fileExtension(file.name)
  if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) throw new Error('La imagen debe ser PNG, JPG o WEBP.')
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar 5 MB.')
  if (IS_DEMO) return demo.uploadSectionImage(file)
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file)
  if (error) throw error
  return supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
}
