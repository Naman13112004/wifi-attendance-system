import { format, isSameDay } from 'date-fns'
import { motion } from 'framer-motion'

const AttendanceCalendar = ({ attendance, stats }) => {
  const currentDate = new Date()
  const currentMonth = format(currentDate, 'MMMM yyyy')
  
  // Generate days for current month
  const daysInMonth = new Date(
    currentDate.getFullYear(), 
    currentDate.getMonth() + 1, 
    0
  ).getDate()

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      day
    )
    
    const attendanceRecord = attendance.find(a => 
      isSameDay(new Date(a.date), date)
    )
    
    return {
      day,
      date,
      present: attendanceRecord?.present || false
    }
  })

  return (
    <div>
      <h4 className="text-md font-medium mb-2">{currentMonth}</h4>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-sm font-medium py-1">
            {day}
          </div>
        ))}
        {days.map(({ day, present }) => (
          <motion.div
            key={day}
            whileHover={{ scale: 1.05 }}
            className={`text-center p-1 rounded-full ${
              present 
                ? 'bg-green-100 text-green-800' 
                : day <= currentDate.getDate() 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {day}
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Present: {stats?.presentDays || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">Absent: {stats?.absentDays || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default AttendanceCalendar