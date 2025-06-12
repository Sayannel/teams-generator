import React, { useState } from 'react'

const Step2Import = ({ handleStepChange, players, setPlayers, config }) => {
  const [inputText, setInputText] = useState('')

  const parseLine = (line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim())
    if (parts.length < 2) return null
    const [name, skillStr, genderRaw] = parts
    const skill = parseInt(skillStr)
    const gender = genderRaw?.toLowerCase() === 'f' ? 'female' : 'male'
    if (!name || isNaN(skill) || skill < 1 || skill > config.skillRange) return null
    return { name, skill, gender }
  }

  const handleImport = () => {
    const lines = inputText.split('\n')
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
    <div>
      <h2 className="mb-3">(2/5) Importer des joueur·euse·s</h2>
      <p>Format : Prénom Nom, niveau, genre (m/f)</p>
      <textarea
        rows="10"
        placeholder="Prénom Nom, 4, m"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="form-control mb-3"
      />
      <div className="row justify-content-between my-4">
        <div className="col col-auto">
          <button className="btn btn-secondary" onClick={() => handleStepChange(1)}>
            &lt; Retour
          </button>
        </div>

        <div className="col col-auto">
          <button className="btn btn-primary" onClick={handleImport}>
            Importer
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step2Import
