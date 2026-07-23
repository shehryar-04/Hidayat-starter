import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ChevronDown, ChevronUp, Users, Scale, BookOpen,
  Zap, Flag, FileText, Filter, Calendar, User, Search,
  ChevronLeft, ChevronRight, RefreshCw, Download
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Badge, Spinner, Card, CardContent, PageWrapper, PageHeader, EmptyState } from '../../shared/ui'

const ENTITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'edge_function', label: 'Edge Functions' },
  { value: 'student', label: 'Student Changes' },
  { value: 'fatwa_question', label: 'Fatwa Workflow' },
  { value: 'hifz', label: 'Hifz Progress' },
  { value: 'moderation', label: 'Moderation' },
  { value: 'fatwa_revision', label: 'Fatwa Edits' },
]

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'progress_change', label: 'Progress Change' },
  { value: 'invoke_success', label: 'Function Success' },
  { value: 'invoke_failure', label: 'Function Failure' },
  { value: 'edit', label: 'Edit / Revision' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'flag', label: 'Flag' },
  { value: 'delete', label: 'Delete' },
  { value: 'mark_spam', label: 'Mark Spam' },
]

const TIME_RANGES = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]

const PAGE_SIZE = 30

const ENTITY_ICONS = {
  edge_function: Zap,
  student: Users,
  fatwa_question: Scale,
  hifz: BookOpen,
  moderation: Flag,
  fatwa_revision: FileText,
}

const ENTITY_COLORS = {
  edge_function: 'bg-blue-50 text-blue-600 border-blue-100',
  student: 'bg-green-50 text-green-600 border-green-100',
  fatwa_question: 'bg-purple-50 text-purple-600 border-purple-100',
  hifz: 'bg-amber-50 text-amber-600 border-amber-100',
  moderation: 'bg-red-50 text-red-600 border-red-100',
  fatwa_revision: 'bg-indigo-50 text-indigo-600 border-indigo-100',
}

/**
 * AuditLogViewer — Unified timeline of all system audit events.
 * Filterable by entity type, action, actor, and time range.
 */
export default function AuditLogViewer() {
  const [logs, setLogs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [days, setDays] = useState(30)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [page, setPage] = useState(0)

  // Actor lookup cache
  const [actors, setActors] = useState([])

  const loadLogs = useCallback(async () => {
    setLoading(true)

    const params = {
      p_days: days,
      p_entity_type: entityType || null,
      p_action: action || null,
      p_actor_id: null,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    }

    const [logRes, countRes] = await Promise.all([
      supabase.rpc('get_unified_audit_log', params),
      supabase.rpc('get_unified_audit_log_count', {
        p_days: days,
        p_entity_type: entityType || null,
        p_action: action || null,
        p_actor_id: null,
      }),
    ])

    setLogs(logRes.data || [])
    setTotalCount(Number(countRes.data) || 0)
    setLoading(false)
  }, [days, entityType, action, page])

  useEffect(() => { loadLogs() }, [loadLogs])

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0) }, [days, entityType, action])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const filteredLogs = actorSearch.trim()
    ? logs.filter(l => l.actor_name?.toLowerCase().includes(actorSearch.toLowerCase()))
    : logs

  const exportCSV = () => {
    const headers = ['Time', 'Type', 'Action', 'Actor', 'Old Value', 'New Value']
    const rows = filteredLogs.map(l => [
      new Date(l.occurred_at).toISOString(),
      l.entity_type,
      l.action,
      l.actor_name,
      l.old_value || '',
      l.new_value || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Audit Log"
        description="Unified timeline of all system actions across the platform."
        icon={<Shield className="text-primary" />}
      />

      {/* ═══ Filters ═══ */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time range */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {TIME_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Entity type */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={entityType}
                onChange={e => setEntityType(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {ENTITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Action */}
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {ACTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>

            {/* Actor search */}
            <div className="relative flex-1 min-w-[150px] max-w-[250px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={actorSearch}
                onChange={e => setActorSearch(e.target.value)}
                placeholder="Filter by actor name..."
                className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">{totalCount.toLocaleString()} events</span>
              <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs">
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading} className="text-xs">
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Timeline ═══ */}
      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No audit events"
          description="No matching events found for the selected filters and time range."
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />

          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, i) => (
                <AuditLogEntry
                  key={log.id}
                  log={log}
                  isExpanded={expandedId === log.id}
                  onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ═══ Pagination ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Page {page + 1} of {totalPages} ({totalCount} total events)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

// ─── Individual Log Entry ────────────────────────────────────

function AuditLogEntry({ log, isExpanded, onToggle, index }) {
  const Icon = ENTITY_ICONS[log.entity_type] || Shield
  const colorCls = ENTITY_COLORS[log.entity_type] || 'bg-gray-50 text-gray-600 border-gray-100'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="relative pl-0 sm:pl-12"
    >
      {/* Timeline dot */}
      <div className={`absolute left-3 top-4 w-4 h-4 rounded-full border-2 hidden sm:flex items-center justify-center ${colorCls}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      </div>

      <div
        className={`bg-white rounded-lg border transition-all cursor-pointer ${
          isExpanded ? 'border-primary-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'
        }`}
      >
        {/* Summary Row */}
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          {/* Entity icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[10px] px-1.5 py-0 ${colorCls}`}>
                {log.entity_type.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs font-medium text-gray-800">
                {formatAction(log.action)}
              </span>
              {log.old_value && log.new_value && log.action === 'status_change' && (
                <span className="text-xs text-gray-500">
                  {log.old_value} → <span className="font-medium text-gray-700">{log.new_value}</span>
                </span>
              )}
              {log.action === 'edit' && log.new_value && (
                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                  "{log.new_value}"
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <User className="w-2.5 h-2.5" /> {log.actor_name}
              </span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">
                {formatTimestamp(log.occurred_at)}
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <div className="flex-shrink-0 text-gray-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <DetailField label="Entity Type" value={log.entity_type} />
                  <DetailField label="Entity ID" value={log.entity_id} mono />
                  <DetailField label="Action" value={log.action} />
                  <DetailField label="Actor" value={log.actor_name} />
                  {log.old_value && <DetailField label="Old Value" value={log.old_value} />}
                  {log.new_value && <DetailField label="New Value" value={log.new_value} />}
                  <DetailField label="Timestamp" value={new Date(log.occurred_at).toLocaleString()} />
                  {log.actor_id && <DetailField label="Actor ID" value={log.actor_id} mono />}
                </div>

                {/* Raw JSON details */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Raw Details</p>
                    <pre className="text-[10px] text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-32 font-mono">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function DetailField({ label, value, mono = false }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xs text-gray-700 mt-0.5 ${mono ? 'font-mono text-[10px] break-all' : ''}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Utilities ───────────────────────────────────────────────

function formatAction(action) {
  const map = {
    status_change: 'Status Changed',
    progress_change: 'Progress Updated',
    invoke_success: 'Function Invoked',
    invoke_failure: 'Function Failed',
    edit: 'Content Edited',
    approve: 'Approved',
    reject: 'Rejected',
    flag: 'Flagged',
    unflag: 'Unflagged',
    delete: 'Deleted',
    restore: 'Restored',
    mark_spam: 'Marked as Spam',
  }
  return map[action] || action.replace(/_/g, ' ')
}

function formatTimestamp(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
