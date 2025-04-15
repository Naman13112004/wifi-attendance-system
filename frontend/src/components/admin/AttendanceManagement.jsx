import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const AttendanceManagement = ({ classId, classes }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)
        const response = await api.get('/admin/show-attendance', {
          params: {
            classId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        })
        setAttendanceRecords(response.data.attendanceRecords)
      } catch (error) {
        toast.error('Failed to fetch attendance records')
      } finally {
        setLoading(false)
      }
    }

    if (classId) fetchAttendance()
  }, [classId, dateRange])

  const handleDateChange = (e) => {
    const { name, value } = e.target
    setDateRange(prev => ({ ...prev, [name]: value }))
  }

  if (loading) return <div className="text-center py-8">Loading attendance data...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-medium">
          Attendance for {classes.find(c => c.id === classId)?.name || 'Selected Class'}
        </h3>
        
        <div className="flex gap-2">
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="border rounded-lg px-2 py-1"
          />
          <span>to</span>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="border rounded-lg px-2 py-1"
          />
        </div>
      </div>

      {attendanceRecords.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WiFi Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.wifiSSID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600">
                      {record.students.filter(s => s.present).length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">
                      {record.students.filter(s => !s.present).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No attendance records found for the selected period</p>
        </div>
      )}
    </div>
  )
}

export default AttendanceManagement