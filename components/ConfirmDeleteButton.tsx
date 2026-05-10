'use client'

import { useRef } from 'react'

// Renders a destructive trigger button. Click opens a native <dialog> with a
// confirm form. The form's action is the bound server action (the caller
// pre-binds whatever ids/return-urls it needs).
export function ConfirmDeleteButton({
  triggerLabel = 'Delete',
  title,
  message,
  confirmLabel = 'Yes, delete',
  formAction,
}: {
  triggerLabel?: string
  title: string
  message: string
  confirmLabel?: string
  formAction: (formData: FormData) => void | Promise<void>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="text-sm text-red-700 underline underline-offset-2"
      >
        {triggerLabel}
      </button>
      <dialog
        ref={ref}
        className="rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="max-w-sm space-y-4 p-6">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-stone-700">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-lg px-4 py-2 text-sm text-stone-700"
            >
              Cancel
            </button>
            <form action={formAction}>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                {confirmLabel}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
