import { motion } from 'framer-motion'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const ClassManagement = ({ classes, selectedClass, onSelectClass, attendanceSummary }) => {
  const selectedClassData = classes.find(c => c.id === selectedClass)
  const classSummary = attendanceSummary.find(s => s.classId === selectedClass) || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <motion.div
            key={cls.id}
            whileHover={{ y: -5 }}
            onClick={() => onSelectClass(cls.id)}
            className={`p-4 rounded-lg cursor-pointer transition ${
              selectedClass === cls.id
                ? 'bg-indigo-100 border-2 border-indigo-500'
                : 'bg-white border border-gray-200 hover:shadow-md'
            }`}
          >
            <h3 className="font-semibold text-lg">{cls.name}</h3>
            <p className="text-gray-600">{cls.studentCount} students</p>
            <div className="mt-2 flex justify-between">
              <span className="text-sm">WiFi: {cls.wifiSSID || 'Not set'}</span>
              <span className="text-sm font-medium">
                {classSummary.attendanceRate?.toFixed(1) || 0}% attendance
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedClassData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">{selectedClassData.name} Statistics</h4>
          <div className="h-64">
            <Bar
              data={{
                labels: ['Attendance Rate', 'Present', 'Absent'],
                datasets: [{
                  label: 'Students',
                  data: [
                    classSummary.attendanceRate || 0,
                    classSummary.presentCount || 0,
                    (classSummary.totalCount || 0) - (classSummary.presentCount || 0)
                  ],
                  backgroundColor: [
                    'rgba(79, 70, 229, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                  ],
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassManagement