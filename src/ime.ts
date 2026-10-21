export interface ImeHandlers {
  onCompose: (text: string) => void
  onCommit: (text: string) => void
}

/**
 * Match only text the IME has committed.
 * compositionend with data commits immediately and ignores the input event
 * that Chrome fires synchronously afterwards. An empty compositionend leaves
 * the commit to the following input event. Composition updates never commit.
 */
export function attachIme(input: HTMLInputElement, handlers: ImeHandlers): () => void {
  let composing = false
  let ignoreInput = false

  const onStart = () => {
    composing = true
    handlers.onCompose(input.value)
  }
  const onUpdate = () => {
    composing = true
    handlers.onCompose(input.value)
  }
  const onEnd = (event: CompositionEvent) => {
    composing = false
    const data = event.data ?? ''
    if (!data) return
    ignoreInput = true
    queueMicrotask(() => {
      ignoreInput = false
    })
    input.value = ''
    handlers.onCommit(data)
  }
  const onInput = () => {
    if (composing || ignoreInput) {
      if (composing) handlers.onCompose(input.value)
      return
    }
    const value = input.value
    if (!value) {
      handlers.onCompose('')
      return
    }
    input.value = ''
    handlers.onCommit(value)
  }

  input.addEventListener('compositionstart', onStart)
  input.addEventListener('compositionupdate', onUpdate)
  input.addEventListener('compositionend', onEnd)
  input.addEventListener('input', onInput)

  return () => {
    input.removeEventListener('compositionstart', onStart)
    input.removeEventListener('compositionupdate', onUpdate)
    input.removeEventListener('compositionend', onEnd)
    input.removeEventListener('input', onInput)
  }
}
