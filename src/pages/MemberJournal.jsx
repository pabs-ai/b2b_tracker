import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { CheckCircle, Circle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const SECTIONS = [
  {
    key: 'career',
    label: 'Career and tech skills',
    icon: '🎓',
    prompt: "What's been your biggest challenge translating your military experience into civilian language?",
    sub: 'M01–M06 modules',
  },
  {
    key: 'va_benefits',
    label: 'VA benefits and healthcare',
    icon: '🏥',
    prompt: 'What VA benefit are you most unsure about right now?',
    sub: 'Claims, healthcare, education',
  },
  {
    key: 'job_placement',
    label: 'Job placement',
    icon: '💼',
    prompt: 'What role or industry are you targeting and why?',
    sub: 'Applications and interviews',
  },
]

const STATUS_STYLES = {
  not_started: { background: '#e8e8e8', color: '#888' },
  on_track: { background: '#e8f5e9', color: '#2e7d32' },
  needs_attention: { background: '#fef3c7', color: '#b45309' },
  complete: { background: '#e8f5e9', color: '#2e7d32' },
  overdue: { background: '#fef2f2', color: '#b91c1c' },
}
const STATUS_LABELS = {
  not_started: 'Not started', on_track: 'On track',
  needs_attention: 'Needs attention', complete: 'Complete', overdue: 'Overdue'
}

export default function MemberJournal() {
  const { token } = useParams()
  const [member, setMember] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [statuses, setStatuses] = useState({})
  const [journalEntries, setJournalEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expanded, setExpanded] = useState({ career: true, va_benefits: true, job_placement: true })
  const [journalText, setJournalText] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => { loadData() }, [token])

  async function loadData() {
    const { data: m } = await supabase.from('members').select('*').eq('token', token).single()
    if (!m) { setNotFound(true); setLoading(false); return }
    setMember(m)

    const { data: ms } = await supabase.from('milestones').select('*').eq('member_id', m.id).order('created_at')
    setMilestones(ms || [])

    const { data: ss } = await supabase.from('section_statuses').select('*').eq('member_id', m.id)
    const statusMap = {}
    ;(ss || []).forEach(s => { statusMap[s.section] = s.status })
    setStatuses(statusMap)

    const { data: je } = await supabase.from('journal_entries').select('*').eq('member_id', m.id).eq('is_instructor_note', false)
    setJournalEntries(je || [])

    const initText = {}
    ;(je || []).forEach(e => { initText[e.section] = e.content })
    setJournalText(initText)

    setLoading(false)
  }

  async function toggleMilestone(id, completed) {
    await supabase.from('milestones').update({ completed: !completed }).eq('id', id)
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !completed } : m))
  }

  async function saveJournal(section) {
    const content = journalText[section] || ''
    setSaving(prev => ({ ...prev, [section]: true }))
    const existing = journalEntries.find(e => e.section === section)
    if (existing) {
      await supabase.from('journal_entries').update({ content }).eq('id', existing.id)
    } else {
      await supabase.from('journal_entries').insert({ member_id: member.id, section, content, is_instructor_note: false })
    }
    setSaving(prev => ({ ...prev, [section]: false }))
    loadData()
  }

  const progress = milestones.length
    ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)
    : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ textAlign: 'center' }}>
        <RefreshCw size={24} color="#f26522" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading your journal...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 20, color: '#1a2f52', marginBottom: 8 }}>Journal not found</h2>
        <p style={{ fontSize: 14, color: '#888' }}>This link may be invalid. Contact your instructor.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '1.5rem 1rem' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#1a2f52', borderRadius: 14, padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#f26522',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff'
            }}>
              {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{member.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {member.track === 'skillbridge' ? 'SkillBridge' : 'Regular cohort'} · Boots2Bytes
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#f26522' }}>{progress}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ height: 8, background: '#e8e8e8', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#f26522', borderRadius: 99, width: `${progress}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: '#888' }}>Overall transition progress</span>
            <span style={{ fontSize: 12, color: '#f26522', fontWeight: 500 }}>{milestones.filter(m => m.completed).length} of {milestones.length} milestones</span>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map(sec => {
          const secMilestones = milestones.filter(m => m.section === sec.key)
          const doneCount = secMilestones.filter(m => m.completed).length
          const status = statuses[sec.key] || 'not_started'
          const isExpanded = expanded[sec.key]
          const entry = journalEntries.find(e => e.section === sec.key)

          return (
            <div key={sec.key} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8e8e8', marginBottom: '1rem', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.875rem 1.125rem', background: '#f5f5f5', borderBottom: isExpanded ? '0.5px solid #e8e8e8' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setExpanded(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{sec.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#1a2f52' }}>{sec.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{sec.sub} · {doneCount} of {secMilestones.length} complete</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                    ...STATUS_STYLES[status]
                  }}>{STATUS_LABELS[status]}</span>
                  {isExpanded ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {secMilestones.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <button
                        onClick={() => toggleMilestone(m.id, m.completed)}
                        style={{ background: 'none', border: 'none', padding: 0, marginTop: 1, flexShrink: 0, cursor: 'pointer' }}
                      >
                        {m.completed
                          ? <CheckCircle size={20} color="#f26522" fill="#fef0e8" />
                          : <Circle size={20} color="#e8e8e8" />
                        }
                      </button>
                      <div>
                        <div style={{ fontSize: 14, color: m.completed ? '#aaa' : '#1a2f52', textDecoration: m.completed ? 'line-through' : 'none', lineHeight: 1.5 }}>
                          {m.label}
                        </div>
                        {m.due_date && <div style={{ fontSize: 12, color: '#f26522', marginTop: 2 }}>Due {m.due_date}</div>}
                      </div>
                    </div>
                  ))}

                  {secMilestones.length === 0 && (
                    <p style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>No items in this section yet.</p>
                  )}

                  <div style={{ borderTop: '0.5px solid #e8e8e8', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Journal prompt
                    </div>
                    <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>{sec.prompt}</p>
                    <textarea
                      placeholder="Write your response here..."
                      value={journalText[sec.key] || ''}
                      onChange={e => setJournalText(prev => ({ ...prev, [sec.key]: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%', fontSize: 13, padding: '0.625rem 0.75rem', borderRadius: 8,
                        border: '0.5px solid #e8e8e8', resize: 'vertical', lineHeight: 1.5, color: '#1a2f52',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => saveJournal(sec.key)}
                      disabled={saving[sec.key]}
                      style={{
                        marginTop: 6, background: '#1a2f52', color: '#fff', border: 'none',
                        borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 500,
                        opacity: saving[sec.key] ? 0.6 : 1
                      }}
                    >
                      {saving[sec.key] ? 'Saving...' : entry ? 'Update response' : 'Save response'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: '0.5rem' }}>
          Your journal is private — only you and your instructor can see this.
        </p>
      </div>
    </div>
  )
}
