import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HeroImage from '../assets/images/hero.svg'

const Home = () => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-indigo-600"
        >
          AttendEase
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {user ? (
            <Link 
              to={user.role === 'student' ? '/student/dashboard' : '/admin/dashboard'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex gap-4">
              <Link 
                to="/student/login" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Student Login
              </Link>
              <Link 
                to="/admin/login" 
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
              >
                Admin Login
              </Link>
            </div>
          )}
        </motion.div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:w-1/2"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Modern Attendance <span className="text-indigo-600">Tracking</span> System
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Streamline your classroom attendance with our intuitive platform. 
              Students can mark attendance via WiFi verification, while teachers 
              get powerful analytics and management tools.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/student/signup" 
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Student Signup
              </Link>
              <Link 
                to="/admin/signup" 
                className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
              >
                Admin Signup
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="md:w-1/2"
          >
            <img 
              src={HeroImage} 
              alt="Attendance System" 
              className="w-full h-auto max-w-lg mx-auto"
            />
          </motion.div>
        </div>
      </main>
      
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "WiFi-Based Attendance",
                description: "Students can only mark attendance when connected to the class's specific WiFi network.",
                icon: "📶"
              },
              {
                title: "Real-time Analytics",
                description: "Teachers get instant insights into class attendance patterns and student participation.",
                icon: "📊"
              },
              {
                title: "Easy Management",
                description: "Create classes, manage students, and update attendance records with just a few clicks.",
                icon: "🔄"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-indigo-50 p-6 rounded-xl hover:shadow-md transition"
                whileHover={{ y: -5 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-indigo-700">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home