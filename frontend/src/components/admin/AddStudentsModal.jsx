import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

const AddStudentsModal = ({ isOpen, onClose, onSubmit, classId }) => {
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await api.get('/admin/students')
        // Filter out students already in this class
        const classResponse = await api.get('/admin/classes')
        const currentClass = classResponse.data.classes.find(c => c.id === classId)
        const currentStudentIds = currentClass?.students?.map(s => s._id) || []
        
        setStudents(response.data.filter(
          student => !currentStudentIds.includes(student._id)
        ))
      } catch (error) {
        toast.error('Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && classId) fetchStudents()
  }, [isOpen, classId])

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student')
      return
    }
    onSubmit(selectedStudents)
    setSelectedStudents([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col"
      >
        <h3 className="text-xl font-semibold mb-4">Add Students to Class</h3>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p>Loading students...</p>
          </div>
        ) : students.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {students.map(student => (
                  <div
                    key={student._id}
                    onClick={() => toggleStudentSelection(student._id)}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedStudents.includes(student._id)
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                      {selectedStudents.includes(student._id) && (
                        <span className="text-indigo-600">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                disabled={selectedStudents.length === 0}
              >
                Add Selected ({selectedStudents.length})
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">No available students to add</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AddStudentsModal