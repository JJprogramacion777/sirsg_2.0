import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  /** Texto que el admin debe escribir para confirmar (RF-16). */
  confirmWord?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/** RF-16: confirmación manual obligatoria antes de eliminar. */
export function ConfirmDialog({ open, title, message, confirmWord = 'ELIMINAR', onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setTyped('')
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="card m-auto w-[min(92vw,28rem)] p-6 text-text backdrop:bg-black/70"
    >
      <h2 className="font-mono text-lg text-danger">{title}</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <p className="mt-4 text-sm">
        Escribe <span className="font-mono font-semibold text-danger">{confirmWord}</span> para confirmar:
      </p>
      <input className="field mt-2" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button className="btn btn-danger" onClick={confirm} disabled={typed !== confirmWord || busy}>
          {busy ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
      </div>
    </dialog>
  )
}
