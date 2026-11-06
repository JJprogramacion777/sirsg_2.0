// Sustituye a api.ts en el build de producción (alias "@demo" en vite.config.ts):
// el código y los datos de ejemplo del modo demo no viajan al sitio publicado.
import type * as Api from './api'

function off(): never {
  throw new Error('El modo demo solo existe con npm run dev.')
}

export const getPublishedSection: typeof Api.getPublishedSection = off
export const listLatestSections: typeof Api.listLatestSections = off
export const saveSection: typeof Api.saveSection = off
export const deleteSection: typeof Api.deleteSection = off
export const listEvents: typeof Api.listEvents = off
export const listAllEvents: typeof Api.listAllEvents = off
export const saveEvent: typeof Api.saveEvent = off
export const deleteEvent: typeof Api.deleteEvent = off
export const listDocuments: typeof Api.listDocuments = off
export const downloadUrl: typeof Api.downloadUrl = off
export const uploadDocument: typeof Api.uploadDocument = off
export const deleteDocument: typeof Api.deleteDocument = off
export const uploadSectionImage: typeof Api.uploadSectionImage = off
export const sendContact: typeof Api.sendContact = off
export const listMessages: typeof Api.listMessages = off
export const updateRegistration: typeof Api.updateRegistration = off
export const deleteMessage: typeof Api.deleteMessage = off
export const startPractice: typeof Api.startPractice = off
export const finishPractice: typeof Api.finishPractice = off
export const listAttempts: typeof Api.listAttempts = off
export const deleteAttempt: typeof Api.deleteAttempt = off
export const getDemoSession: typeof Api.getDemoSession = () => null
export const onDemoSession: typeof Api.onDemoSession = () => () => false
export const login: typeof Api.login = off
export const logout: typeof Api.logout = off
