import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { format, subDays } from 'date-fns'
import AttendanceCalendar from '../../components/student/AttendanceCalendar'
import MarkAttendanceModal from '../../components/student/MarkAttendanceModal'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [attendanceRes, statsRes] = await Promise.all([
          api.get('/user/show-attendance', {
            params: { 
              startDate: format(subDays(new Date(), timeRange === 'week' ? 7 : 30)), 
              endDate: format(new Date(), 'yyyy-MM-dd')
            }
          }),
          api.get('/user/profile')
        ])
        
        setAttendance(attendanceRes.data.attendanceRecords)
        setStats(statsRes.data.statistics)
      } catch (error) {
        toast.error('Failed to fetch attendance data')
      } finally {
        setLoading(false)
      }
    }
    
    if (user) fetchData()
  }, [timeRange, user])

  const handleMarkAttendance = async (wifiSSID) => {
    try {
      await api.post('/user/mark-attendance', { wifiSSID })
      toast.success('Attendance marked successfully!')
      setIsModalOpen(false)
      // Refresh data
      const [attendanceRes, statsRes] = await Promise.all([
        api.get('/user/show-attendance'),
        api.get('/user/profile')
      ])
      setAttendance(attendanceRes.data.attendanceRecords)
      setStats(statsRes.data.statistics)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance')
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Student Dashboard</h1>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {user?.enrolledClass ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 bg-white p-6 rounded-xl shadow"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Welcome, {user.name}</h2>
                  <p className="text-gray-600">
                    Enrolled in <span className="font-medium">{user.enrolledClass.name}</span>
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats?.attendancePercentage || 0}%
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Mark Attendance
                  </motion.button>
                </div>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Attendance Overview</h3>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-1 border rounded-lg"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
                
                {attendance.length > 0 ? (
                  <Bar
                    data={{
                      labels: attendance.map(item => format(new Date(item.date), 'MMM dd')),
                      datasets: [{
                        label: 'Attendance',
                        data: attendance.map(item => item.present ? 1 : 0),
                        backgroundColor: attendance.map(item => 
                          item.present ? '#4f46e5' : '#ef4444'
                        ),
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 1,
                          ticks: {
                            callback: value => value === 1 ? 'Present' : 'Absent'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8">No attendance records found</p>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow"
              >
                <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
                <AttendanceCalendar 
                  attendance={attendance} 
                  stats={stats} 
                />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow"
            >
              <h3 className="text-lg font-semibold mb-4">Detailed Records</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WiFi Network</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.length > 0 ? (
                      attendance.map((record, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.present 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.present ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.wifiSSID || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.timestamp ? format(new Date(record.timestamp), 'hh:mm a') : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No attendance records available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-xl shadow text-center"
          >
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold mb-2">Not Enrolled in Any Class</h2>
            <p className="text-gray-600 mb-6">
              You are not currently enrolled in any class. Please contact your administrator to get enrolled.
            </p>
            <div className="flex flex-col items-center">
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg max-w-md">
                <p className="text-yellow-800">
                  Once enrolled, you'll be able to mark your attendance when connected to the class WiFi.
                </p>
              </div>
              <button 
                onClick={logout}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </main>
      
      <MarkAttendanceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleMarkAttendance}
        classWifi={user?.enrolledClass?.wifiSSID}
      />
    </div>
  )
}

export default StudentDashboard