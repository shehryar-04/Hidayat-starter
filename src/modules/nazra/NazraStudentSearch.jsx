import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Card, CardContent, EmptyState } from '../../shared/ui'
import { Search, Users } from 'lucide-react'

/**
 * Nazra Student Search Component
 * Searches for students to track their Nazra progress
 * Requirements: 6.1
 */
export function NazraStudentSearch({ onSelectStudent }) {
  const [searchName, setSearchName] = useState('')
  const [searchEnrollment, setSearchEnrollment] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('students')
        .select(
          `
          id,
          enrollment_number,
          profile_id,
          status,
          profiles:profile_id (
            id,
            full_name
          )
        `
        )
        .eq('status', 'active')

      if (searchName) {
        query = query.ilike('profiles.full_name', `%${searchName}%`)
      }

      if (searchEnrollment) {
        query = query.ilike('enrollment_number', `%${searchEnrollment}%`)
      }

      const { data, error: err } = await query.limit(50)

      if (err) throw err
      setResults(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="search-name" className="text-sm font-medium text-neutral-700">Student Name</label>
            <Input
              id="search-name"
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="search-enrollment" className="text-sm font-medium text-neutral-700">Enrollment Number</label>
            <Input
              id="search-enrollment"
              type="text"
              placeholder="Search by enrollment number..."
              value={searchEnrollment}
              onChange={(e) => setSearchEnrollment(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" loading={loading}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {results.length === 0 && !loading && (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Try adjusting your search criteria."
          />
        )}

        {results.map((student) => (
          <Card
            key={student.id}
            interactive
            onClick={() => onSelectStudent(student)}
          >
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-neutral-800">{student.profiles?.full_name}</h3>
                <p className="text-sm text-neutral-500">Enrollment: {student.enrollment_number}</p>
              </div>
              <Button variant="outline" size="sm">Track Progress</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
