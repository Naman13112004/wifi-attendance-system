import { motion } from 'framer-motion'
import { useState } from 'react'

const CreateClassModal = ({ isOpen, onClose, onSubmit }) => {
  const [classData, setClassData] = useState({
    name: '',
    wifiSSID: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setClassData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(classData)
    setClassData({ name: '', wifiSSID: '' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-lg w-full max-w-md"
      >
        <h3 className="text-xl font-semibold mb-4">Create New Class</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Class Name</label>
            <input
              type="text"
              name="name"
              value={classData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">WiFi SSID</label>
            <input
              type="text"
              name="wifiSSID"
              value={classData.wifiSSID}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Network name for attendance verification"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Create Class
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default CreateClassModal