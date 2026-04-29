import { useState } from 'react'
import './App.css'

const initialPlayers = [
  {
    id: 1,
    name: 'Andrei Pavel',
    position: 'CB',
    squad: 'Senior Squad',
    status: 'Renewal due',
    owner: 'Raluca M.',
    age: 24,
    contractEnd: '2026-04-19',
    phone: '+40 744 000 101',
    notes: 'Captain profile, agent expects offer by Friday.',
  },
  {
    id: 2,
    name: 'Mihai Cretu',
    position: 'CM',
    squad: 'U19',
    status: 'Medical follow-up',
    owner: 'Dr. Ionescu',
    age: 18,
    contractEnd: '2026-06-30',
    phone: '+40 744 000 102',
    notes: 'Return-to-play plan enters phase 2 next week.',
  },
  {
    id: 3,
    name: 'David Sandu',
    position: 'RW',
    squad: 'U17',
    status: 'Scout interest',
    owner: 'Sporting Director',
    age: 16,
    contractEnd: '2027-06-30',
    phone: '+40 744 000 103',
    notes: 'Two clubs requested April performance clips.',
  },
  {
    id: 4,
    name: 'Robert Lupu',
    position: 'GK',
    squad: 'Senior Squad',
    status: 'Registration pending',
    owner: 'Operations',
    age: 27,
    contractEnd: '2026-08-01',
    phone: '+40 744 000 104',
    notes: 'Awaiting federation confirmation on transfer file.',
  },
]

const kpiCards = [
  { label: 'Active player records', value: '148', delta: '+12 this month' },
  { label: 'Academy attendance', value: '93%', delta: 'Up 4% vs last week' },
  { label: 'Contracts to renew', value: '9', delta: '3 urgent in 14 days' },
  { label: 'Open staff tasks', value: '27', delta: '8 blocked by approvals' },
]

const fixtures = [
  {
    competition: 'Liga 4 Bacau',
    match: 'FC Viitorul Onesti vs ACS Moinesti',
    date: 'Saturday, 12 Apr',
    focus: 'Need sponsor banner approval and physio coverage',
  },
  {
    competition: 'U17 Regional',
    match: 'LPS Roman vs FC Viitorul Onesti',
    date: 'Sunday, 13 Apr',
    focus: 'Transport manifest due by Thursday',
  },
  {
    competition: 'Academy Friendly',
    match: 'Viitorul U15 vs Aerostar Bacau',
    date: 'Tuesday, 15 Apr',
    focus: 'Scout attendance confirmed',
  },
]

const pipeline = [
  { stage: 'Lead', count: 18, detail: 'Academy families and local sponsors' },
  { stage: 'Qualified', count: 11, detail: 'Need meeting slots this week' },
  { stage: 'Proposal', count: 5, detail: 'Two kit package offers outstanding' },
  { stage: 'Closing', count: 2, detail: 'Medical partner and bus operator' },
]

const tasks = [
  {
    team: 'Operations',
    title: 'Finalize first-team away travel roster',
    deadline: 'Today · 16:00',
    priority: 'High',
  },
  {
    team: 'Commercial',
    title: 'Send revised local sponsor deck',
    deadline: 'Thu · 11:00',
    priority: 'Medium',
  },
  {
    team: 'Academy',
    title: 'Collect missing parent consent forms',
    deadline: 'Thu · 18:30',
    priority: 'High',
  },
  {
    team: 'Medical',
    title: 'Review rehab notes for Mihai Cretu',
    deadline: 'Fri · 09:00',
    priority: 'Low',
  },
]

const attendance = [
  { group: 'Senior Squad', rate: '96%', trend: 'Full week availability' },
  { group: 'U19', rate: '91%', trend: '2 school exam absences' },
  { group: 'U17', rate: '94%', trend: 'Stable' },
  { group: 'U15', rate: '89%', trend: 'Transport disruption on Tuesday' },
]

const sponsors = [
  {
    partner: 'Construct Invest',
    type: 'Main Partner',
    renewal: '30 Apr',
    health: 'Strong',
  },
  {
    partner: 'Clinica Plus',
    type: 'Medical',
    renewal: '18 Apr',
    health: 'Needs call',
  },
  {
    partner: 'TransCarpatica',
    type: 'Transport',
    renewal: '07 May',
    health: 'Proposal sent',
  },
]

const defaultPlayerForm = {
  name: '',
  position: 'CM',
  squad: 'U19',
  status: 'Active',
  owner: 'Operations',
  age: '17',
  contractEnd: '',
  phone: '',
  notes: '',
}

function App() {
  const [players, setPlayers] = useState(initialPlayers)
  const [selectedPlayerId, setSelectedPlayerId] = useState(initialPlayers[0].id)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [playerForm, setPlayerForm] = useState(defaultPlayerForm)

  const filteredPlayers = players.filter((player) => {
    const searchValue = `${player.name} ${player.position} ${player.squad} ${player.owner}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const statusMatches = statusFilter === 'All' || player.status === statusFilter

    return searchValue && statusMatches
  })

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) ?? filteredPlayers[0] ?? null

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setPlayerForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreatePlayer = (event) => {
    event.preventDefault()

    const newPlayer = {
      id: Date.now(),
      name: playerForm.name.trim(),
      position: playerForm.position,
      squad: playerForm.squad,
      status: playerForm.status,
      owner: playerForm.owner.trim(),
      age: Number(playerForm.age),
      contractEnd: playerForm.contractEnd || 'TBD',
      phone: playerForm.phone.trim() || 'Not added yet',
      notes: playerForm.notes.trim() || 'No notes added yet.',
    }

    if (!newPlayer.name || !newPlayer.owner) {
      return
    }

    setPlayers((current) => [newPlayer, ...current])
    setSelectedPlayerId(newPlayer.id)
    setPlayerForm(defaultPlayerForm)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">FC Viitorul Onesti CRM</p>
          <h1>One place for players, staff, fixtures, and local partners.</h1>
          <p className="hero-text">
            A match-week command center for the club: track contract risk,
            academy attendance, operational blockers, and sponsor momentum
            without switching between spreadsheets.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-action">
              Review urgent renewals
            </button>
            <button type="button" className="secondary-action">
              Open match-week checklist
            </button>
          </div>
        </div>

        <div className="match-card">
          <div className="match-card__header">
            <span>Next first-team fixture</span>
            <span className="pill pill-alert">2 blockers</span>
          </div>
          <h2>FC Viitorul Onesti vs ACS Moinesti</h2>
          <p>Saturday, 12 April · CSM Onesti Ground</p>

          <div className="match-grid">
            <article>
              <strong>Squad readiness</strong>
              <span>21 available, 2 under evaluation</span>
            </article>
            <article>
              <strong>Logistics</strong>
              <span>Physio slot and banners still unconfirmed</span>
            </article>
            <article>
              <strong>Commercial</strong>
              <span>3 hospitality invites awaiting response</span>
            </article>
            <article>
              <strong>Media</strong>
              <span>Posters approved, lineup graphic pending</span>
            </article>
          </div>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Club metrics">
        {kpiCards.map((card) => (
          <article key={card.label} className="metric-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.delta}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="primary-column">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="section-tag">Player desk</p>
                <h2>Player management</h2>
              </div>
              <span className="badge-inline">{filteredPlayers.length} visible records</span>
            </div>

            <div className="player-workspace">
              <section className="player-browser">
                <div className="player-controls">
                  <label className="field">
                    <span>Search</span>
                    <input
                      type="search"
                      name="search"
                      placeholder="Search player, squad, owner"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Status</span>
                    <select
                      name="statusFilter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option>All</option>
                      <option>Active</option>
                      <option>Renewal due</option>
                      <option>Medical follow-up</option>
                      <option>Scout interest</option>
                      <option>Registration pending</option>
                    </select>
                  </label>
                </div>

                <div className="player-list">
                  {filteredPlayers.length ? (
                    filteredPlayers.map((player) => (
                      <button
                        type="button"
                        key={player.id}
                        className={`player-row player-row-button${
                          selectedPlayer?.id === player.id ? ' is-selected' : ''
                        }`}
                        onClick={() => setSelectedPlayerId(player.id)}
                      >
                        <div>
                          <h3>{player.name}</h3>
                          <p>
                            {player.position}, {player.squad}
                          </p>
                        </div>
                        <div className="player-meta">
                          <span className="pill">{player.status}</span>
                          <span>{player.owner}</span>
                        </div>
                        <p className="row-note">{player.notes}</p>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <h3>No players match this filter</h3>
                      <p>Try another status or clear the search field.</p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="player-detail">
                {selectedPlayer ? (
                  <>
                    <div className="detail-header">
                      <div>
                        <p className="section-tag">Selected player</p>
                        <h3>{selectedPlayer.name}</h3>
                      </div>
                      <span className="pill">{selectedPlayer.status}</span>
                    </div>

                    <div className="detail-grid">
                      <article>
                        <span>Squad</span>
                        <strong>{selectedPlayer.squad}</strong>
                      </article>
                      <article>
                        <span>Position</span>
                        <strong>{selectedPlayer.position}</strong>
                      </article>
                      <article>
                        <span>Age</span>
                        <strong>{selectedPlayer.age}</strong>
                      </article>
                      <article>
                        <span>Owner</span>
                        <strong>{selectedPlayer.owner}</strong>
                      </article>
                      <article>
                        <span>Contract end</span>
                        <strong>{selectedPlayer.contractEnd}</strong>
                      </article>
                      <article>
                        <span>Phone</span>
                        <strong>{selectedPlayer.phone}</strong>
                      </article>
                    </div>

                    <div className="detail-note">
                      <span>Staff notes</span>
                      <p>{selectedPlayer.notes}</p>
                    </div>
                  </>
                ) : null}
              </aside>
            </div>
          </article>

          <article className="panel panel-accent">
            <div className="section-heading">
              <div>
                <p className="section-tag">Registration</p>
                <h2>Add new player record</h2>
              </div>
              <span className="badge-inline">Updates list instantly</span>
            </div>

            <form className="player-form" onSubmit={handleCreatePlayer}>
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  name="name"
                  value={playerForm.name}
                  onChange={handleFieldChange}
                  placeholder="Example: Stefan Popa"
                  required
                />
              </label>

              <label className="field">
                <span>Position</span>
                <select name="position" value={playerForm.position} onChange={handleFieldChange}>
                  <option>GK</option>
                  <option>CB</option>
                  <option>LB</option>
                  <option>RB</option>
                  <option>CM</option>
                  <option>AM</option>
                  <option>LW</option>
                  <option>RW</option>
                  <option>ST</option>
                </select>
              </label>

              <label className="field">
                <span>Squad</span>
                <select name="squad" value={playerForm.squad} onChange={handleFieldChange}>
                  <option>Senior Squad</option>
                  <option>U19</option>
                  <option>U17</option>
                  <option>U15</option>
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select name="status" value={playerForm.status} onChange={handleFieldChange}>
                  <option>Active</option>
                  <option>Renewal due</option>
                  <option>Medical follow-up</option>
                  <option>Scout interest</option>
                  <option>Registration pending</option>
                </select>
              </label>

              <label className="field">
                <span>Record owner</span>
                <input
                  type="text"
                  name="owner"
                  value={playerForm.owner}
                  onChange={handleFieldChange}
                  placeholder="Example: Academy Office"
                  required
                />
              </label>

              <label className="field">
                <span>Age</span>
                <input
                  type="number"
                  min="10"
                  max="40"
                  name="age"
                  value={playerForm.age}
                  onChange={handleFieldChange}
                />
              </label>

              <label className="field">
                <span>Contract end</span>
                <input
                  type="date"
                  name="contractEnd"
                  value={playerForm.contractEnd}
                  onChange={handleFieldChange}
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={playerForm.phone}
                  onChange={handleFieldChange}
                  placeholder="+40 ..."
                />
              </label>

              <label className="field field-full">
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={playerForm.notes}
                  onChange={handleFieldChange}
                  rows="4"
                  placeholder="Medical, contract, family, or scouting notes"
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-action">
                  Create player
                </button>
              </div>
            </form>
          </article>

          <article className="panel" id="player-pipeline">
            <div className="section-heading">
              <div>
                <p className="section-tag">Commercial flow</p>
                <h2>Partner pipeline</h2>
              </div>
              <span className="badge-inline">36 total opportunities</span>
            </div>

            <div className="pipeline-grid">
              {pipeline.map((item) => (
                <article key={item.stage} className="pipeline-card">
                  <p>{item.stage}</p>
                  <strong>{item.count}</strong>
                  <span>{item.detail}</span>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="section-tag">Calendar</p>
                <h2>Upcoming fixtures</h2>
              </div>
              <span className="badge-inline">3 events in 7 days</span>
            </div>

            <div className="fixture-stack">
              {fixtures.map((fixture) => (
                <article key={fixture.match} className="fixture-card">
                  <div>
                    <p>{fixture.competition}</p>
                    <h3>{fixture.match}</h3>
                  </div>
                  <div className="fixture-side">
                    <strong>{fixture.date}</strong>
                    <span>{fixture.focus}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="sidebar-column">
          <article className="panel compact-panel">
            <div className="section-heading">
              <div>
                <p className="section-tag">Staff board</p>
                <h2>Priority tasks</h2>
              </div>
            </div>

            <div className="task-list">
              {tasks.map((task) => (
                <article key={task.title} className="task-row">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.team}</p>
                  </div>
                  <div className="task-meta">
                    <span className={`pill pill-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <strong>{task.deadline}</strong>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel compact-panel">
            <div className="section-heading">
              <div>
                <p className="section-tag">Academy</p>
                <h2>Attendance snapshot</h2>
              </div>
            </div>

            <div className="attendance-list">
              {attendance.map((entry) => (
                <article key={entry.group} className="attendance-row">
                  <div>
                    <h3>{entry.group}</h3>
                    <p>{entry.trend}</p>
                  </div>
                  <strong>{entry.rate}</strong>
                </article>
              ))}
            </div>
          </article>

          <article className="panel compact-panel">
            <div className="section-heading">
              <div>
                <p className="section-tag">Sponsors</p>
                <h2>Renewal radar</h2>
              </div>
            </div>

            <div className="sponsor-list">
              {sponsors.map((sponsor) => (
                <article key={sponsor.partner} className="sponsor-row">
                  <div>
                    <h3>{sponsor.partner}</h3>
                    <p>{sponsor.type}</p>
                  </div>
                  <div className="sponsor-meta">
                    <span>{sponsor.health}</span>
                    <strong>{sponsor.renewal}</strong>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  )
}

export default App
