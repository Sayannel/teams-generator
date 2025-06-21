import React, { useState } from 'react'

const Step2Import = ({ handleStepChange, players, setPlayers }) => {
  const [inputText, setInputText] = useState('')

  const parseLine = (line, lineIndex, errors) => {
    const parts = line
      .split(/[,\t]/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (parts.length === 0) {
      errors.push(`Ligne ${lineIndex + 1} vide ou invalide : "${line}"`)
      return null
    }

    const name = parts[0]
    let skill = 1
    let gender = 'male'

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].toLowerCase()
      if (!isNaN(Number(part))) {
        skill = parseInt(part, 10)
      } else if (['m', 'male'].includes(part)) {
        gender = 'male'
      } else if (['f', 'female'].includes(part)) {
        gender = 'female'
      } else {
        errors.push(`Ligne ${lineIndex + 1} : valeur inconnue "${parts[i]}"`)
        return null
      }
    }

    if (!name || skill <= 0 || isNaN(skill)) {
      errors.push(`Ligne ${lineIndex + 1} invalide (nom ou niveau) : "${line}"`)
      return null
    }

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
    const errors = []

    lines.forEach((line, index) => {
      const parsed = parseLine(line, index, errors)
      if (parsed) newPlayers.push(parsed)
    })

    if (errors.length > 0) {
      alert(`Certaines lignes ont été ignorées :\n\n${errors.join('\n')}`)
    }

    if (newPlayers.length === 0) {
      return
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
          Vous avez déjà ajouté {players.length} joueur·euse·s{' '}
          <button className="btn btn-link text-red p-0" onClick={() => handleStepChange(3)}>
            Aller directement à la liste de joueur·euse·s
          </button>
        </div>
      )}

      <p className="text-muted mb-3">
        <i>Le niveau 1 correspond aux débutant·e·s et il n'y a pas de niveau maximum.</i>
        <br />
        Les lignes peuvent contenir : <code>Nom</code>, <code>genre (m/f)</code>,{' '}
        <code>niveau</code>
      </p>

      <textarea
        rows="10"
        placeholder={'Axel G, 4, m\nAxel G, 4\nAxel G, m'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="form-control mb-3"
      />

      <div className="fixed-controls p-3 p-md-0 shadow-lg">
        <div className="text-center mt-4">
          <button className="btn btn-red w-100" onClick={handleImport}>
            Importer
          </button>
        </div>

        <hr />

        <div className="row justify-content-between ">
          <div className="col col-auto">
            <button className="btn btn-outline-red" onClick={() => handleStepChange(1)}>
              &lt; Retour
            </button>
          </div>

          <div className="col col-auto">
            <button className="btn btn-red" onClick={() => handleStepChange(3)}>
              Passer l'import &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step2Import
