import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

const MarkAttendanceModal = ({ isOpen, onClose, onSubmit, classWifi }) => {
  const [wifiSSID, setWifiSSID] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!wifiSSID) {
      toast.error('Please enter WiFi SSID')
      return
    }
    onSubmit(wifiSSID)
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
        <h3 className="text-xl font-semibold mb-4">Mark Attendance</h3>
        <p className="text-gray-600 mb-4">
          You must be connected to the class WiFi to mark attendance.
          {classWifi && (
            <span className="font-medium"> Class WiFi: {classWifi}</span>
          )}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">WiFi SSID</label>
            <input
              type="text"
              value={wifiSSID}
              onChange={(e) => setWifiSSID(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter WiFi network name"
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
              Mark Attendance
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default MarkAttendanceModal