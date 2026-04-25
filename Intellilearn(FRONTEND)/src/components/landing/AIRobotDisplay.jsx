import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';
import { Sparkles, MessageCircle } from 'lucide-react';

export default function AIRobotDisplay() {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative cursor-pointer group"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Animated Glow Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        
        {/* Robot Body */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          whileTap={{ scale: 0.95 }}
          className="relative w-20 h-20 md:w-24 md:h-24 bg-[#0d1333] border-2 border-purple-500/30 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-xl"
        >
          {/* Eyes/Display Area */}
          <div className="absolute top-1/4 w-12 h-6 bg-slate-900 rounded-full flex items-center justify-around px-2 border border-white/5">
            <motion.div 
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
              className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" 
            />
            <motion.div 
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
              className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" 
            />
          </div>

          <FaRobot className="w-10 h-10 md:w-12 md:h-12 text-purple-400 mt-4" />
          
          {/* Antenna */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-1 h-4 bg-purple-500/50 rounded-full" />
            <motion.div 
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
            />
          </div>
        </motion.div>

        {/* Floating Particles around robot */}
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x: -40, y: -20 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-0 left-0 p-2 bg-blue-500/20 rounded-lg backdrop-blur-md border border-blue-500/30"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x: 40, y: -40 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-0 right-0 p-2 bg-purple-500/20 rounded-lg backdrop-blur-md border border-purple-500/30"
              >
                <MessageCircle className="w-4 h-4 text-purple-400" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Interaction Prompt */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, x: 0 }}
          className="absolute right-full mr-6 top-1/2 -translate-y-1/2 hidden md:block"
        >
          <div className="bg-[#0d1333] border border-white/10 px-4 py-2 rounded-2xl whitespace-nowrap shadow-2xl">
            <p className="text-white font-bold text-sm">Need help? I'm Dr. Intelli!</p>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Click to start learning</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
