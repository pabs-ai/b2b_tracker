import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Users, AlertTriangle, CheckCircle, Clock, Plus, Copy, ExternalLink, LogOut, RefreshCw } from 'lucide-react'

const SECTIONS = ['career', 'va_benefits', 'job_placement', 'coaching']
const SECTION_LABELS = { career: 'Career skills', va_benefits: 'VA benefits', job_placement: 'Job search', coaching: 'Coaching' }
const STATUS_OPTIONS = ['not_started', 'on_track', 'needs_attention', 'complete', 'overdue']
const STATUS_LABELS = { not_started: 'Not started', on_track: 'On track', needs_attention: 'Needs attention', complete: 'Complete', overdue: 'Overdue' }
const STATUS_STYLES = {
  not_started: { background: '#e8e8e8', color: '#888' },
  on_track: { background: '#e8f5e9', color: '#2e7d32' },
  needs_attention: { background: '#fef3c7', color: '#b45309' },
  complete: { background: '#e8f5e9', color: '#2e7d32' },
  overdue: { background: '#fef2f2', color: '#b91c1c' },
}

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
}

function calcProgress(member) {
  if (!member.milestones) return 0
  const all = member.milestones
  if (!all.length) return 0
  const done = all.filter(m => m.completed).length
  return Math.round((done / all.length) * 100)
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#1a2f52','#f26522','#2e4875','#0f6e56','#534ab7','#854f0b','#0c447c','#a32d2d']

export default function Dashboard() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTrack, setNewTrack] = useState('regular')
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(null)
  const [expandedMember, setExpandedMember] = useState(null)

  useEffect(() => {
    if (!sessionStorage.getItem('b2b_instructor')) {
      navigate('/login')
      return
    }
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select('*, milestones(*), journal_entries(*)')
      .order('created_at', { ascending: false })
    if (!error) setMembers(data || [])
    setLoading(false)
  }

  async function addMember() {
    if (!newName.trim()) return
    setAdding(true)
    const token = generateToken()
    const { data: member, error } = await supabase
      .from('members')
      .insert({ name: newName.trim(), track: newTrack, token })
      .select()
      .single()

    if (!error && member) {
      const defaultMilestones = [
        { member_id: member.id, section: 'career', label: 'M01 — Orientation and tech mindset', completed: false, due_date: null },
        { member_id: member.id, section: 'career', label: 'M02 — Building your civilian brand', completed: false, due_date: null },
        { member_id: member.id, section: 'career', label: 'M03 — LinkedIn overview', completed: false, due_date: null },
        { member_id: member.id, section: 'career', label: 'M04 — The power of networking', completed: false, due_date: null },
        { member_id: member.id, section: 'career', label: 'M05 — Resume overview', completed: false, due_date: null },
        { member_id: member.id, section: 'career', label: 'M06 — Interview prep and mock interviews', completed: false, due_date: null },
        { member_id: member.id, section: 'va_benefits', label: 'VA claim filed', completed: false, due_date: null },
        { member_id: member.id, section: 'va_benefits', label: 'VA healthcare enrollment completed', completed: false, due_date: null },
        { member_id: member.id, section: 'va_benefits', label: 'Disability rating understood', completed: false, due_date: null },
        { member_id: member.id, section: 'va_benefits', label: 'Education benefits (GI Bill / VR&E) reviewed', completed: false, due_date: null },
        { member_id: member.id, section: 'job_placement', label: 'Resume approved by instructor', completed: false, due_date: null },
        { member_id: member.id, section: 'job_placement', label: '10+ applications submitted', completed: false, due_date: null },
        { member_id: member.id, section: 'job_placement', label: 'First interview completed', completed: false, due_date: null },
        { member_id: member.id, section: 'job_placement', label: 'Offer received or active pipeline', completed: false, due_date: null },
      ]
      await supabase.from('milestones').insert(defaultMilestones)
    }
    setNewName('')
    setNewTrack('regular')
    setShowAddModal(false)
    setAdding(false)
    loadMembers()
  }

  function copyLink(token) {
    const url = `${window.location.origin}/b2b-tracker/member/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  async function updateSectionStatus(memberId, section, status) {
    await supabase
      .from('section_statuses')
      .upsert({ member_id: memberId, section, status }, { onConflict: 'member_id,section' })
    loadMembers()
  }

  const filtered = members.filter(m => {
    if (filter === 'all') return true
    if (filter === 'skillbridge') return m.track === 'skillbridge'
    if (filter === 'regular') return m.track === 'regular'
    if (filter === 'needs_attention') {
      const statuses = (m.section_statuses || []).map(s => s.status)
      return statuses.includes('needs_attention') || statuses.includes('overdue')
    }
    if (filter === 'complete') return calcProgress(m) === 100
    return true
  })

  const needsAttentionCount = members.filter(m => {
    const statuses = (m.section_statuses || []).map(s => s.status)
    return statuses.includes('needs_attention') || statuses.includes('overdue')
  }).length

  const completeCount = members.filter(m => calcProgress(m) === 100).length
  const onTrackCount = members.filter(m => {
    const p = calcProgress(m)
    return p > 0 && p < 100 && !((m.section_statuses || []).map(s => s.status).includes('needs_attention'))
  }).length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ textAlign: 'center' }}>
        <RefreshCw size={24} color="#f26522" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading cohort...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '1.5rem' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#1a2f52', borderRadius: 14, padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: '#f26522',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff'
            }}>B2</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Instructor dashboard</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Boots2Bytes · Transition Readiness Tracker</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowAddModal(true)} style={{
              background: '#f26522', color: '#fff', border: 'none', borderRadius: 8,
              padding: '0.5rem 1rem', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Plus size={15} /> Add member
            </button>
            <button onClick={() => { sessionStorage.removeItem('b2b_instructor'); navigate('/login') }} style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5
            }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
          {[
            { icon: <Users size={18} />, num: members.length, label: 'Total members', color: '#1a2f52' },
            { icon: <CheckCircle size={18} />, num: onTrackCount, label: 'On track', color: '#f26522' },
            { icon: <AlertTriangle size={18} />, num: needsAttentionCount, label: 'Need attention', color: '#b91c1c' },
            { icon: <CheckCircle size={18} />, num: completeCount, label: 'Complete', color: '#2e7d32' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '1rem', border: '0.5px solid #e8e8e8' }}>
              <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alert */}
        {needsAttentionCount > 0 && (
          <div style={{
            background: '#fef3c7', border: '0.5px solid #fde68a', borderRadius: 10,
            padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <AlertTriangle size={18} color="#b45309" />
            <span style={{ fontSize: 13, color: '#b45309' }}>
              {needsAttentionCount} member{needsAttentionCount > 1 ? 's' : ''} need your attention — check the dashboard below.
            </span>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All members' },
            { key: 'needs_attention', label: 'Needs attention' },
            { key: 'skillbridge', label: 'SkillBridge' },
            { key: 'regular', label: 'Regular cohort' },
            { key: 'complete', label: 'Complete' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              fontSize: 12, padding: '5px 14px', borderRadius: 99,
              border: filter === f.key ? 'none' : '0.5px solid #e8e8e8',
              background: filter === f.key ? '#1a2f52' : '#fff',
              color: filter === f.key ? '#fff' : '#444', fontWeight: filter === f.key ? 500 : 400
            }}>{f.label}</button>
          ))}
        </div>

        {/* Members table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8e8e8', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 80px 1fr 1fr 1fr 120px',
            padding: '0.625rem 1.25rem', background: '#f5f5f5', borderBottom: '0.5px solid #e8e8e8'
          }}>
            {['Member', 'Progress', 'Career', 'VA benefits', 'Job search', 'Actions'].map(h => (
              <span key={h} style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: 14 }}>
              No members yet. Add your first cohort member above.
            </div>
          )}

          {filtered.map((member, idx) => {
            const progress = calcProgress(member)
            const statuses = {}
            ;(member.section_statuses || []).forEach(s => { statuses[s.section] = s.status })
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]

            return (
              <React.Fragment key={member.id}>
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 80px 1fr 1fr 1fr 120px',
                    padding: '0.875rem 1.25rem', borderBottom: '0.5px solid #f0f0f0',
                    alignItems: 'center', cursor: 'pointer',
                    background: expandedMember === member.id ? '#fef0e8' : 'transparent'
                  }}
                  onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', background: avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 500, color: '#fff', flexShrink: 0
                    }}>{getInitials(member.name)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a2f52' }}>{member.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                        {member.track === 'skillbridge' ? 'SkillBridge' : 'Regular cohort'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#f26522' }}>{progress}%</div>
                    <div style={{ height: 4, background: '#e8e8e8', borderRadius: 99, marginTop: 4, width: 50 }}>
                      <div style={{ height: '100%', background: '#f26522', borderRadius: 99, width: `${progress}%` }} />
                    </div>
                  </div>

                  {['career', 'va_benefits', 'job_placement'].map(sec => {
                    const s = statuses[sec] || 'not_started'
                    return (
                      <span key={sec} style={{
                        fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 99,
                        display: 'inline-block', ...STATUS_STYLES[s]
                      }}>{STATUS_LABELS[s]}</span>
                    )
                  })}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={e => { e.stopPropagation(); copyLink(member.token) }}
                      title="Copy member link"
                      style={{ background: 'none', border: 'none', color: copied === member.token ? '#2e7d32' : '#f26522', padding: 4 }}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); window.open(`/b2b-tracker/member/${member.token}`, '_blank') }}
                      title="Open member journal"
                      style={{ background: 'none', border: 'none', color: '#1a2f52', padding: 4 }}
                    >
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </div>

                {expandedMember === member.id && (
                  <MemberExpandedRow
                    member={member}
                    statuses={statuses}
                    onStatusChange={(section, status) => updateSectionStatus(member.id, section, status)}
                    onCopyLink={() => copyLink(member.token)}
                    copied={copied === member.token}
                    onRefresh={loadMembers}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a2f52', marginBottom: '1.5rem' }}>Add cohort member</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Full name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMember()}
                style={{ padding: '0.75rem', borderRadius: 8, border: '0.5px solid #e8e8e8', fontSize: 14 }}
              />
              <select
                value={newTrack}
                onChange={e => setNewTrack(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: 8, border: '0.5px solid #e8e8e8', fontSize: 14 }}
              >
                <option value="regular">Regular cohort</option>
                <option value="skillbridge">SkillBridge</option>
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowAddModal(false)} style={{
                  flex: 1, padding: '0.75rem', borderRadius: 8, border: '0.5px solid #e8e8e8',
                  background: '#fff', fontSize: 14, color: '#444'
                }}>Cancel</button>
                <button onClick={addMember} disabled={adding || !newName.trim()} style={{
                  flex: 1, padding: '0.75rem', borderRadius: 8, border: 'none',
                  background: '#f26522', color: '#fff', fontSize: 14, fontWeight: 500,
                  opacity: adding || !newName.trim() ? 0.6 : 1
                }}>{adding ? 'Adding...' : 'Add member'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberExpandedRow({ member, statuses, onStatusChange, onCopyLink, copied, onRefresh }) {
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [newItemSection, setNewItemSection] = useState('career')
  const [addingItem, setAddingItem] = useState(false)

  async function saveNote() {
    if (!note.trim()) return
    setSavingNote(true)
    await supabase.from('journal_entries').insert({
      member_id: member.id, section: 'coaching', content: note.trim(), is_instructor_note: true
    })
    setNote('')
    setSavingNote(false)
    onRefresh()
  }

  async function addCustomItem() {
    if (!newItem.trim()) return
    setAddingItem(true)
    await supabase.from('milestones').insert({
      member_id: member.id, section: newItemSection, label: newItem.trim(), completed: false
    })
    setNewItem('')
    setAddingItem(false)
    onRefresh()
  }

  async function toggleMilestone(id, completed) {
    await supabase.from('milestones').update({ completed: !completed }).eq('id', id)
    onRefresh()
  }

  const instructorNotes = (member.journal_entries || []).filter(e => e.is_instructor_note)

  return (
    <div style={{ padding: '1rem 1.25rem 1.25rem', background: '#fef0e8', borderBottom: '0.5px solid #fde0c8' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Section status controls */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#1a2f52', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Update section status
          </div>
          {['career', 'va_benefits', 'job_placement'].map(sec => (
            <div key={sec} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#444' }}>{SECTION_LABELS[sec]}</span>
              <select
                value={statuses[sec] || 'not_started'}
                onChange={e => onStatusChange(sec, e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '0.5px solid #e8e8e8', background: '#fff' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Coaching notes */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#1a2f52', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Coaching notes (instructor only)
          </div>
          {instructorNotes.slice(-2).map(n => (
            <div key={n.id} style={{ fontSize: 12, color: '#444', background: '#fff', borderRadius: 6, padding: '6px 10px', marginBottom: 6, border: '0.5px solid #e8e8e8' }}>
              {n.content}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              placeholder="Add a session note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNote()}
              style={{ flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '0.5px solid #e8e8e8' }}
            />
            <button onClick={saveNote} disabled={savingNote || !note.trim()} style={{
              background: '#1a2f52', color: '#fff', border: 'none', borderRadius: 6,
              padding: '6px 12px', fontSize: 12, opacity: savingNote || !note.trim() ? 0.6 : 1
            }}>Save</button>
          </div>
        </div>
      </div>

      {/* Add custom milestone */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid #fde0c8' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#1a2f52', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Add custom checklist item
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={newItemSection}
            onChange={e => setNewItemSection(e.target.value)}
            style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '0.5px solid #e8e8e8', background: '#fff' }}
          >
            <option value="career">Career skills</option>
            <option value="va_benefits">VA benefits</option>
            <option value="job_placement">Job placement</option>
            <option value="coaching">Coaching</option>
          </select>
          <input
            placeholder="Custom item label..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomItem()}
            style={{ flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '0.5px solid #e8e8e8' }}
          />
          <button onClick={addCustomItem} disabled={addingItem || !newItem.trim()} style={{
            background: '#f26522', color: '#fff', border: 'none', borderRadius: 6,
            padding: '6px 12px', fontSize: 12, opacity: addingItem || !newItem.trim() ? 0.6 : 1
          }}>Add</button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
        <button onClick={onCopyLink} style={{
          fontSize: 12, color: copied ? '#2e7d32' : '#f26522', background: 'none',
          border: '0.5px solid currentColor', borderRadius: 6, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 5
        }}>
          <Copy size={12} /> {copied ? 'Copied!' : 'Copy member link'}
        </button>
        <button onClick={() => window.open(`/b2b-tracker/member/${member.token}`, '_blank')} style={{
          fontSize: 12, color: '#1a2f52', background: 'none',
          border: '0.5px solid #e8e8e8', borderRadius: 6, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 5
        }}>
          <ExternalLink size={12} /> View journal
        </button>
      </div>
    </div>
  )
}
