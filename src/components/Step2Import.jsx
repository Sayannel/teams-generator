import React, { useState } from 'react'

const Step2Import = ({ handleStepChange, players, setPlayers }) => {
  const [inputText, setInputText] = useState('')

  const parseLine = (line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim())
    if (parts.length < 2) return null
    const [name, skillStr, genderRaw] = parts
    const skill = parseInt(skillStr)
    const gender = genderRaw?.toLowerCase() === 'f' ? 'female' : 'male'

    return { id: crypto.randomUUID(), name, skill, gender }
  }

  const handleImport = () => {
    const lines = inputText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (lines.length === 0) {
      alert('La liste est vide. Veuillez saisir au moins un·e joueur·euse.')
      return
    }

    const newPlayers = []
    for (const line of lines) {
      const parsed = parseLine(line)

      if (parsed) newPlayers.push(parsed)
    }

    setPlayers([...players, ...newPlayers])
    setInputText('')
    handleStepChange(3)
  }

  return (
    <div className="text-center">
      <h2 className="mb-3 text-red">Importer des joueur·euse·s</h2>
      {players.length > 0 && (
        <div className="alert alert-light fw-bold">
          Vous avez déjà ajouté {players.length} joueur.euse.s{' '}
          <button className="btn btn-link text-red p-0" onClick={() => handleStepChange(3)}>
            Aller directement à la liste de joueur.euse.s
          </button>
        </div>
      )}
      <p className="text-muted mb-3">
        <i>Le niveau 1 correspond aux débutant.e.s</i>
      </p>

      <textarea
        rows="10"
        placeholder="Prénom Nom, 4, m"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="form-control mb-3"
      />
      <div className="row justify-content-between mt-4">
        <div className="col col-auto">
          <button className="btn btn-outline-red" onClick={() => handleStepChange(1)}>
            &lt; Retour
          </button>
        </div>

        <div className="col col-auto">
          <button className="btn btn-red" onClick={handleImport}>
            Importer
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step2Import
