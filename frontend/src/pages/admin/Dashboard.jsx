import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { format, subDays } from 'date-fns'
import ClassManagement from '../../components/admin/ClassManagement'
import AttendanceManagement from '../../components/admin/AttendanceManagement'
import StudentManagement from '../../components/admin/StudentManagement'
import CreateClassModal from '../../components/admin/CreateClassModal'
import AddStudentsModal from '../../components/admin/AddStudentsModal'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [attendanceSummary, setAttendanceSummary] = useState([])
  const [studentsCount, setStudentsCount] = useState({ total: 0, byClass: [] })
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false)
  const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('classes')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [classesRes, summaryRes, countRes] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/attendance-summary'),
          api.get('/admin/students-count')
        ])

        console.log("Classes: " + classesRes.data.classes);

        setClasses(classesRes.data.classes)
        setAttendanceSummary(summaryRes.data)
        setStudentsCount(countRes.data)

        if (classesRes.data.classes.length > 0 && !selectedClass) {
          setSelectedClass(classesRes.data.classes[0].id)
        }
      } catch (error) {
        toast.error('Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClass])

  const handleCreateClass = async (classData) => {
    try {
      const response = await api.post('/admin/create-class', classData)
      toast.success('Class created successfully!')
      setIsCreateClassModalOpen(false)
      // Refresh classes list
      const classesRes = await api.get('/admin/classes')
      setClasses(classesRes.data.classes)
      setSelectedClass(response.data.class.id)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class')
    }
  }

  const handleAddStudents = async (studentIds) => {
    try {
      const response = await api.post('/admin/add-students-to-class', {
        classId: selectedClass,
        studentIds: studentIds.map(id => id) // Ensure it's a plain array
      });

      if (response.data.success) {
        toast.success(`Successfully added ${response.data.addedCount} students`);
        setIsAddStudentsModalOpen(false);

        // Refresh data
        const [classesRes, countRes] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/students-count')
        ]);
        setClasses(classesRes.data.classes);
        setStudentsCount(countRes.data);
      } else {
        toast.error(response.data.message || 'Failed to add students');
      }
    } catch (error) {
      console.error("Add students error:", error);
      if (error.response?.data?.invalidIds) {
        toast.error(`Invalid student IDs: ${error.response.data.invalidIds.join(', ')}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to add students');
      }
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:w-1/4"
          >
            <div className="bg-white p-6 rounded-xl shadow sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Classes</p>
                  <p className="text-2xl font-bold">{classes.length}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Total Students</p>
                  <p className="text-2xl font-bold">{studentsCount.total}</p>
                </div>

                {attendanceSummary.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Avg Attendance</p>
                    <p className="text-2xl font-bold">
                      {(
                        attendanceSummary.reduce((sum, item) => sum + item.attendanceRate, 0) /
                        attendanceSummary.length
                      ).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">Students by Class</h3>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: studentsCount.byClass.map(c => c.className),
                      datasets: [{
                        data: studentsCount.byClass.map(c => c.count),
                        backgroundColor: [
                          '#4f46e5',
                          '#10b981',
                          '#f59e0b',
                          '#ef4444',
                          '#8b5cf6'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="flex border-b mb-6">
              {['classes', 'attendance', 'students'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium ${activeTab === tab
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'classes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Class Management</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateClassModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Create New Class
                  </motion.button>
                </div>

                <ClassManagement
                  classes={classes}
                  selectedClass={selectedClass}
                  onSelectClass={setSelectedClass}
                  attendanceSummary={attendanceSummary}
                />
              </motion.div>
            )}

            {activeTab === 'attendance' && selectedClass && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AttendanceManagement
                  classId={selectedClass}
                  classes={classes}
                />
              </motion.div>
            )}

            {activeTab === 'students' && selectedClass && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Student Management</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddStudentsModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Add Students
                  </motion.button>
                </div>

                <StudentManagement
                  classId={selectedClass}
                  classes={classes}
                />
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        onSubmit={handleCreateClass}
      />

      <AddStudentsModal
        isOpen={isAddStudentsModalOpen}
        onClose={() => setIsAddStudentsModalOpen(false)}
        onSubmit={handleAddStudents}
        classId={selectedClass}
      />
    </div>
  )
}

export default AdminDashboard