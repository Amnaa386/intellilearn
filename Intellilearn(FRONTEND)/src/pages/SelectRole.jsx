import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaUserShield } from 'react-icons/fa';
import { useEffect } from 'react';

const roles = [
  {
    key: 'student',
    title: 'Student',
    desc: 'Personalized AI-powered learning and progress tracking.',
    icon: <FaUserGraduate className="text-5xl text-blue-400 mb-4" />,
  },
  {
    key: 'admin',
    title: 'Admin',
    desc: 'Oversee system operations, users, and global settings.',
    icon: <FaUserShield className="text-5xl text-orange-400 mb-4" />,
  },
];

export default function SelectRole() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('intellilearn_isLoggedIn') === 'true';
    const savedRole = localStorage.getItem('intellilearn_role');
    
    if (isLoggedIn) {
      if (savedRole === 'student') navigate('/dashboard/student', { replace: true });
      else if (savedRole === 'admin') navigate('/dashboard/admin', { replace: true });
      else navigate('/dashboard/student', { replace: true });
    }
  }, [navigate]);

  const handleSelect = (role) => {
    localStorage.setItem('intellilearn_role', role);
    navigate('/auth/register');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f2c] to-[#2d1a4a] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-extrabold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 z-10"
      >
        Choose Your Account Type
      </motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 z-10 px-6 max-w-4xl mx-auto">
        {roles.map((role, idx) => (
          <motion.button
            key={role.key}
            whileHover={{ scale: 1.07, boxShadow: '0 0 32px 4px #7f5cff' }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.15, duration: 0.5, type: 'spring' }}
            onClick={() => handleSelect(role.key)}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-10 flex flex-col items-center border border-blue-900/30 shadow-lg cursor-pointer transition-all duration-300 hover:border-blue-500/60 hover:bg-blue-900/10 focus:outline-none w-full"
          >
            {role.icon}
            <div className="font-bold text-xl mb-2 text-blue-200">{role.title}</div>
            <div className="text-slate-300 text-center text-sm">{role.desc}</div>
          </motion.button>
        ))}
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-slate-500 text-sm z-10"
      >
        Already have an account? <span onClick={() => navigate('/auth/login')} className="text-blue-400 cursor-pointer hover:underline">Sign In</span>
      </motion.p>
    </div>
  );
}
