import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Plus, Trash2, Tag } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Button, Input, Spinner, EmptyState, Card, CardContent, Badge, PageWrapper, PageHeader } from '../../../shared/ui'

/**
 * SavedSearches — User page to manage saved search alerts.
 * "Notify me when a fatwa is published in category X."
 */
export default function SavedSearches() {
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', category_1: '', category_2: '', category_3: '', keywords: '', notify_email: true })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .order('created_at', { ascending: false })

    setSearches(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.label.trim()) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('saved_searches').insert({
      user_id: user.id,
      label: form.label.trim(),
      category_1: form.category_1 || null,
      category_2: form.category_2 || null,
      category_3: form.category_3 || null,
      keywords: form.keywords || null,
      notify_email: form.notify_email,
    })

    setForm({ label: '', category_1: '', category_2: '', category_3: '', keywords: '', notify_email: true })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const toggleActive = async (id, current) => {
    await supabase
      .from('saved_searches')
      .update({ is_active: !current })
      .eq('id', id)
    load()
  }

  const deleteSearch = async (id) => {
    await supabase.from('saved_searches').delete().eq('id', id)
    load()
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Saved Searches & Alerts"
        description="Get notified when new fatwas matching your interests are published."
        icon={<Bell className="text-primary" />}
      />

      <div className="mb-6">
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus size={14} className="mr-1" /> New Alert
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Alert Name *</label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. New Nikah-related fatwas"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Category 1</label>
                  <Input
                    value={form.category_1}
                    onChange={(e) => setForm({ ...form, category_1: e.target.value })}
                    placeholder="عبادات"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Category 2</label>
                  <Input
                    value={form.category_2}
                    onChange={(e) => setForm({ ...form, category_2: e.target.value })}
                    placeholder="نماز"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Category 3</label>
                  <Input
                    value={form.category_3}
                    onChange={(e) => setForm({ ...form, category_3: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Keywords (comma-separated)</label>
                <Input
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="نکاح, طلاق"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.notify_email}
                  onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
                  id="notify-email"
                  className="rounded border-gray-300"
                />
                <label htmlFor="notify-email" className="text-sm text-gray-600">
                  Send email notifications
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Alert'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : searches.length === 0 ? (
        <EmptyState
          title="No saved searches"
          description="Create an alert to get notified about new fatwas in specific categories."
        />
      ) : (
        <div className="space-y-2">
          {searches.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                s.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <button
                onClick={() => toggleActive(s.id, s.is_active)}
                className={`p-1.5 rounded-md transition-colors ${
                  s.is_active ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100'
                }`}
                title={s.is_active ? 'Pause alert' : 'Activate alert'}
              >
                {s.is_active ? <Bell size={16} /> : <BellOff size={16} />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {[s.category_1, s.category_2, s.category_3].filter(Boolean).map((cat, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Tag size={10} className="mr-0.5" /> {cat}
                    </Badge>
                  ))}
                  {s.keywords && (
                    <span className="text-xs text-gray-400">Keywords: {s.keywords}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {s.notify_email && (
                  <Badge className="text-xs bg-blue-50 text-blue-700">Email</Badge>
                )}
                <button
                  onClick={() => deleteSearch(s.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete alert"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
