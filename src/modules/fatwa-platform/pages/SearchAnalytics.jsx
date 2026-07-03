import { useState, useEffect } from 'react'
import { BarChart3, Search, MousePointerClick, TrendingUp, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Spinner, Card, CardContent, Badge, PageWrapper, PageHeader, Tabs } from '../../../shared/ui'

/**
 * SearchAnalytics — Admin dashboard showing search performance metrics.
 */
export default function SearchAnalytics() {
  const [tab, setTab] = useState('top')
  const [days, setDays] = useState(30)
  const [data, setData] = useState([])
  const [volume, setVolume] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab, days])

  const loadData = async () => {
    setLoading(true)

    if (tab === 'volume') {
      const { data: vol } = await supabase.rpc('get_search_analytics_volume', { p_days: days })
      setVolume(vol || [])
    } else if (tab === 'top') {
      const { data: res } = await supabase.rpc('get_search_analytics_top_queries', { p_days: days, p_limit: 50 })
      setData(res || [])
    } else if (tab === 'zero') {
      const { data: res } = await supabase.rpc('get_search_analytics_zero_results', { p_days: days, p_limit: 50 })
      setData(res || [])
    } else if (tab === 'ctr') {
      const { data: res } = await supabase.rpc('get_search_analytics_ctr', { p_days: days, p_limit: 50 })
      setData(res || [])
    }

    setLoading(false)
  }

  const totalSearches = volume.reduce((sum, d) => sum + (d.total_searches || 0), 0)
  const avgDaily = volume.length > 0 ? Math.round(totalSearches / volume.length) : 0

  return (
    <PageWrapper>
      <PageHeader
        title="Search Analytics"
        description="Understand how users search and what content gaps exist."
        icon={<BarChart3 className="text-primary" />}
      />

      {/* Time range selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Time range:</span>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              days === d ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { key: 'top', label: 'Top Queries', icon: TrendingUp },
          { key: 'zero', label: 'Zero Results', icon: AlertCircle },
          { key: 'ctr', label: 'Click-Through', icon: MousePointerClick },
          { key: 'volume', label: 'Volume', icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : tab === 'volume' ? (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{totalSearches.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Searches</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{avgDaily.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Avg Daily</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{volume.length}</p>
                <p className="text-xs text-gray-500">Active Days</p>
              </CardContent>
            </Card>
          </div>

          {/* Simple bar visualization */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Search Volume</h4>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {volume.slice(0, 30).map((d) => {
                const max = Math.max(...volume.map(v => v.total_searches || 1))
                const pct = ((d.total_searches || 0) / max) * 100
                return (
                  <div key={d.day} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-20 flex-shrink-0">
                      {new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/20 rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">{d.total_searches}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Query</th>
                {tab === 'top' && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Searches</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Avg Results</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                  </>
                )}
                {tab === 'zero' && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Last Searched</th>
                  </>
                )}
                {tab === 'ctr' && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Searches</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800 max-w-xs truncate" dir="auto">
                    {row.query}
                  </td>
                  {tab === 'top' && (
                    <>
                      <td className="px-4 py-2 text-right text-gray-600">{row.search_count}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{row.avg_results}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{row.avg_latency}ms</td>
                    </>
                  )}
                  {tab === 'zero' && (
                    <>
                      <td className="px-4 py-2 text-right">
                        <Badge variant="destructive" className="text-xs">{row.search_count}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500 text-xs">
                        {row.last_searched && new Date(row.last_searched).toLocaleDateString()}
                      </td>
                    </>
                  )}
                  {tab === 'ctr' && (
                    <>
                      <td className="px-4 py-2 text-right text-gray-600">{row.searches}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{row.clicks}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-xs font-medium ${
                          Number(row.ctr) > 50 ? 'text-green-600' : Number(row.ctr) > 20 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {row.ctr}%
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No data for this period.
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
