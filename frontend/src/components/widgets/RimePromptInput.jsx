import { useState } from 'react'
import { Mic, Send } from 'lucide-react'

export default function RimePromptInput({
  input,
  setInput,
  onSubmit,
  placeholder = 'Demander une verification, une valeur ou une source...',
  tone = 'light',
}) {
  const [micHover, setMicHover] = useState(false)
  const [sendHover, setSendHover] = useState(false)
  const iconColor = (hover) => hover ? 'var(--rime-input-icon-hover)' : 'var(--rime-input-icon)'

  return (
    <form onSubmit={onSubmit}>
      <div className={`rime-eye-input tone-${tone}`}>
        <span>{'>'}</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onMouseEnter={() => setMicHover(true)}
          onMouseLeave={() => setMicHover(false)}
          style={{ color: iconColor(micHover) }}
          aria-label="Microphone"
        >
          <Mic size={16} />
        </button>
        <button
          type="submit"
          onMouseEnter={() => setSendHover(true)}
          onMouseLeave={() => setSendHover(false)}
          style={{ color: iconColor(sendHover) }}
          aria-label="Envoyer"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  )
}
