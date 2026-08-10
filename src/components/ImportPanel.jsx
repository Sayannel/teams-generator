import { useMemo, useState } from 'react'
import { parsePlayersFromText } from '../lib/playerImport'
import Button from './ui/Button'

const ImportPanel = ({ onImport, onClose }) => {
  const [inputText, setInputText] = useState('')

  const { players: parsedPlayers, errors } = useMemo(
    () => (inputText.trim() ? parsePlayersFromText(inputText) : { players: [], errors: [] }),
    [inputText]
  )

  const handleImport = () => {
    if (parsedPlayers.length === 0) return
    onImport(parsedPlayers)
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        <i>Le niveau 1 correspond aux débutant·e·s, il n'y a pas de niveau maximum.</i>
        <br />
        Une ligne par joueur·euse :{' '}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">Nom</code>,{' '}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">genre (m/f)</code>,{' '}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">niveau</code>
      </p>

      <textarea
        rows="6"
        autoFocus
        placeholder={'Axel G, 4, m\nAxel G, 4\nAxel G, m'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-left text-slate-900 focus:border-brand-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />

      {errors.length > 0 && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-left text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <p className="mb-1 font-semibold">Lignes ignorées :</p>
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
        <Button className="flex-1" onClick={handleImport} disabled={parsedPlayers.length === 0}>
          Importer {parsedPlayers.length > 0 && `(${parsedPlayers.length})`}
        </Button>
      </div>
    </div>
  )
}

export default ImportPanel
