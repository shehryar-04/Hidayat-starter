import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, GraduationCap, Award, BookOpen, Scale,
  TrendingUp, DollarSign, Shield, Activity, Zap, Clock,
  AlertTriangle, CheckCircle, XCircle, FileText, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers, Server
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner, Card, CardContent, Badge, PageWrapper, PageHeader, Button } from '../../shared/ui'
import { useToast } from '../../shared/ui'

// ─── Main Dashboard ──────────────────────────────────────────
export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null)
  const [enrollmentTrend, setEnrollmentTrend] = useState([])
  const [revenue, setRevenue] = useState([])
  const [userGrowth, setUserGrowth] = useState([])
  const [fatwaPipeline, setFatwaPipeline] = useState(null)
  const [edgeHealth, setEdgeHealth] = useState([])
  const [topCourses, setTopCourses] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [moduleUsage, setModuleUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const { toast } = useToast()

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [
        kpiRes, trendRes, revRes, growthRes,
        fatwaRes, healthRes, coursesRes, activityRes, moduleRes
      ] = await Promise.all([
        supabase.rpc('get_admin_dashboard_kpis'),
        supabase.rpc('get_admin_enrollment_trend', { p_days: 30 }),
        supabase.rpc('get_admin_revenue_summary', { p_months: 6 }),
        supabase.rpc('get_admin_user_growth', { p_days: 30 }),
        supabase.rpc('get_admin_fatwa_pipeline'),
        supabase.rpc('get_admin_edge_function_health', { p_days: 7 }),
        supabase.rpc('get_admin_top_courses', { p_limit: 8 }),
        supabase.rpc('get_admin_recent_activity', { p_limit: 15 }),
        supabase.rpc('get_admin_module_usage'),
      ])

      if (kpiRes.data) setKpis(kpiRes.data)
      if (trendRes.data) setEnrollmentTrend(trendRes.data)
      if (revRes.data) setRevenue(revRes.data)
      if (growthRes.data) setUserGrowth(growthRes.data)
      if (fatwaRes.data) setFatwaPipeline(fatwaRes.data)
      if (healthRes.data) setEdgeHealth(healthRes.data)
      if (coursesRes.data) setTopCourses(coursesRes.data)
      if (activityRes.data) setRecentActivity(activityRes.data)
      if (moduleRes.data) setModuleUsage(moduleRes.data)

      setLastRefresh(new Date())
    } catch (err) {
      console.error('Dashboard load error:', err)
      toast.error('Dashboard Error', 'Failed to load some metrics.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  if (loading && !kpis) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-4 text-sm">Loading dashboard metrics...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" />
            Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform health, growth metrics, and system status at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      {kpis && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <KpiCard icon={Users} label="Total Students" value={kpis.total_students} sub={`${kpis.active_students} active`} color="blue" />
          <KpiCard icon={GraduationCap} label="Active Enrollments" value={kpis.active_enrollments} sub={`+${kpis.enrollments_this_month} this month`} color="green" />
          <KpiCard icon={DollarSign} label="Revenue (MTD)" value={`Rs. ${Number(kpis.revenue_this_month).toLocaleString()}`} sub={`${kpis.enrollments_this_month} enrollments`} color="emerald" />
          <KpiCard icon={Award} label="Certificates" value={kpis.certificates_issued} sub={`${kpis.completed_enrollments} completions`} color="purple" />
          <KpiCard icon={Scale} label="Pending Questions" value={kpis.pending_questions} sub={`${kpis.published_fatwas.toLocaleString()} published`} color="amber" alert={kpis.pending_questions > 10} />
        </section>
      )}

      {/* ═══ Row 2: Enrollment Trend + Revenue ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MiniChart
          title="Enrollment Activity"
          subtitle="Last 30 days"
          icon={TrendingUp}
          data={enrollmentTrend}
          dataKey="new_enrollments"
          secondaryKey="completions"
          labels={{ primary: 'New', secondary: 'Completed' }}
        />
        <MiniChart
          title="Revenue"
          subtitle="Last 6 months"
          icon={DollarSign}
          data={revenue}
          dataKey="revenue"
          xKey="month"
          format="currency"
        />
      </div>

      {/* ═══ Row 3: Fatwa Pipeline + Edge Function Health ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Fatwa Pipeline */}
        {fatwaPipeline && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4 text-primary" />
                Fatwa Pipeline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PipelineStat label="Pending" value={fatwaPipeline.pending} color="yellow" />
                <PipelineStat label="Assigned" value={fatwaPipeline.assigned} color="blue" />
                <PipelineStat label="Under Review" value={fatwaPipeline.under_review} color="purple" />
                <PipelineStat label="Approved" value={fatwaPipeline.approved} color="green" />
                <PipelineStat label="Published (Month)" value={fatwaPipeline.published_this_month} color="emerald" />
                <PipelineStat label="Total Published" value={fatwaPipeline.published_fatwas_total?.toLocaleString()} color="gray" />
              </div>
              {(fatwaPipeline.moderation_flagged > 0 || fatwaPipeline.moderation_spam > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                  {fatwaPipeline.moderation_flagged > 0 && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {fatwaPipeline.moderation_flagged} flagged
                    </Badge>
                  )}
                  {fatwaPipeline.moderation_spam > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      <XCircle className="w-3 h-3 mr-1" /> {fatwaPipeline.moderation_spam} spam
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edge Function Health */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-primary" />
              Edge Function Health
              <span className="text-xs text-gray-400 ml-auto">Last 7 days</span>
            </h3>
            {edgeHealth.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No function calls recorded.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {edgeHealth.map((fn) => (
                  <div key={fn.function_name} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      Number(fn.success_rate) >= 95 ? 'bg-green-500' :
                      Number(fn.success_rate) >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-700 flex-1 truncate font-mono">{fn.function_name}</span>
                    <span className="text-xs text-gray-500">{fn.total_calls} calls</span>
                    <span className={`text-xs font-medium ${
                      Number(fn.success_rate) >= 95 ? 'text-green-600' :
                      Number(fn.success_rate) >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {fn.success_rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Row 4: Top Courses + Module Usage ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-primary" />
                Top Courses by Enrollment
              </h3>
              {topCourses.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No courses yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Course</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">Enrolled</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">Completed</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">Avg Progress</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-500">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCourses.map((c, i) => (
                        <tr key={c.course_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2 px-2 font-medium text-gray-800 max-w-[200px] truncate">
                            <span className="text-gray-400 mr-2">{i + 1}.</span>{c.title}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-600">{c.enrolled}</td>
                          <td className="py-2 px-2 text-right text-green-600">{c.completed}</td>
                          <td className="py-2 px-2 text-right">
                            <span className={Number(c.avg_progress) > 50 ? 'text-green-600' : 'text-gray-500'}>
                              {c.avg_progress}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-gray-800">
                            Rs. {Number(c.revenue).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Module Usage */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-primary" />
              Module Status
            </h3>
            <div className="space-y-2.5">
              {moduleUsage.map((mod) => (
                <div key={mod.module} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${mod.is_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-700 flex-1 capitalize">
                    {mod.module.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {mod.active_users} users
                  </span>
                  <Badge className={`text-[10px] ${mod.is_enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {mod.is_enabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Row 5: User Growth + Recent Activity ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MiniChart
          title="User Signups"
          subtitle="Last 30 days"
          icon={Users}
          data={userGrowth}
          dataKey="signups"
        />

        {/* Recent Activity Feed */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              Recent System Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No recent activity.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    <ActivityIcon type={item.activity_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 truncate">{item.description}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.actor_name} · {formatRelative(item.occurred_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <QuickActionButton href="/student-admin" icon={Users} label="Manage Students" />
            <QuickActionButton href="/short-courses" icon={BookOpen} label="Manage Courses" />
            <QuickActionButton href="/fatwas/moderation" icon={Shield} label="Moderation Queue" />
            <QuickActionButton href="/fatwas/analytics" icon={BarChart3} label="Search Analytics" />
            <QuickActionButton href="/fatwas/import" icon={FileText} label="Bulk Import" />
            <QuickActionButton href="/scholar-admin" icon={GraduationCap} label="Manage Scholars" />
            <QuickActionButton href="/admin-dashboard/audit-log" icon={Shield} label="Audit Log" />
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}

// ─── Sub-Components ──────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, alert = false }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-4 ${alert ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

function PipelineStat({ label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
  }

  return (
    <div className={`rounded-lg border px-3 py-2 ${colors[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-70">{label}</p>
    </div>
  )
}

function MiniChart({ title, subtitle, icon: Icon, data, dataKey, secondaryKey, xKey = 'day', labels, format }) {
  const maxVal = Math.max(...data.map(d => Number(d[dataKey]) || 0), 1)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            {title}
          </h3>
          <span className="text-xs text-gray-400">{subtitle}</span>
        </div>

        {labels && (
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-primary-400" /> {labels.primary}
            </span>
            {labels.secondary && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-400" /> {labels.secondary}
              </span>
            )}
          </div>
        )}

        {/* Simple bar chart */}
        <div className="flex items-end gap-px h-24">
          {data.map((d, i) => {
            const val = Number(d[dataKey]) || 0
            const pct = (val / maxVal) * 100
            const secVal = secondaryKey ? (Number(d[secondaryKey]) || 0) : 0
            const secPct = secondaryKey ? (secVal / maxVal) * 100 : 0

            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-px group relative">
                {secondaryKey && secPct > 0 && (
                  <div
                    className="w-full bg-green-300 rounded-t-sm min-h-[1px] transition-all group-hover:bg-green-400"
                    style={{ height: `${Math.max(secPct, 2)}%` }}
                  />
                )}
                <div
                  className="w-full bg-primary-300 rounded-t-sm min-h-[1px] transition-all group-hover:bg-primary-500"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {format === 'currency' ? `Rs. ${val.toLocaleString()}` : val}
                </div>
              </div>
            )
          })}
        </div>

        {/* X-axis labels (first and last) */}
        {data.length > 0 && (
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-400">
              {formatDate(data[0]?.[xKey])}
            </span>
            <span className="text-[9px] text-gray-400">
              {formatDate(data[data.length - 1]?.[xKey])}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityIcon({ type }) {
  const map = {
    edge_function: { icon: Zap, cls: 'bg-blue-50 text-blue-500' },
    student_status: { icon: Users, cls: 'bg-green-50 text-green-500' },
    fatwa_status: { icon: Scale, cls: 'bg-purple-50 text-purple-500' },
  }
  const { icon: Icon, cls } = map[type] || { icon: Activity, cls: 'bg-gray-50 text-gray-500' }

  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon className="w-3 h-3" />
    </div>
  )
}

function QuickActionButton({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-gray-500" />
      {label}
    </a>
  )
}

// ─── Utilities ───────────────────────────────────────────────

function formatDate(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return val // Already formatted string (like "Jan 2025")
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRelative(dateStr) {
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
