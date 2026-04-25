import { motion } from 'framer-motion';
import { FaRobot, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';
import { Sparkles, MessageSquare, Zap, Cpu, Brain, Terminal } from 'lucide-react';

export default function AITutorSection() {
  return (
    <section className="py-32 px-6 overflow-hidden bg-slate-950/20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
        
        {/* Left Side: Text Content */}
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase"
          >
            <Cpu className="w-3 h-3" /> Powered by Neural Engines
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white leading-tight"
          >
            Meet Your Personal <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              AI Study Partner
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed font-medium"
          >
            Our AI doesn't just give answers—it teaches. Engage in deep 
            conversations, ask follow-up questions, and watch as it adapts 
            its explanations to match your current level of understanding.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {[
              { icon: <MessageSquare className="w-4 h-4" />, text: 'Contextual Awareness' },
              { icon: <Zap className="text-amber-400 w-4 h-4" />, text: 'Real-time Adaptation' },
              { icon: <Brain className="text-purple-400 w-4 h-4" />, text: 'Conceptual Deep-dives' },
              { icon: <Sparkles className="text-blue-400 w-4 h-4" />, text: 'Multi-modal Responses' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                {item.icon}
                <span className="text-sm font-bold text-slate-300">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Mock Interface */}
        <div className="flex-1 relative w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 p-1 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-[2.5rem] shadow-2xl"
          >
            <div className="bg-slate-950 rounded-[2.4rem] overflow-hidden border border-white/10 backdrop-blur-3xl">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <FaRobot className="text-2xl text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm tracking-wide uppercase">IntelliBot v4.0</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Online & Ready</span>
                    </div>
                  </div>
                </div>
                <Terminal className="w-5 h-5 text-slate-700" />
              </div>

              {/* Chat Content */}
              <div className="p-8 space-y-6 h-[400px] overflow-hidden">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex-shrink-0" />
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none text-sm text-slate-300 font-medium">
                    Can you explain the difference between Classical and Quantum Physics?
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <div className="p-4 bg-blue-600 text-white rounded-2xl rounded-tr-none text-sm font-bold shadow-lg shadow-blue-900/40 max-w-[80%]">
                    Think of Classical Physics as the laws for the visible world—like a ball rolling. Quantum Physics deals with the tiny subatomic world where things can be in two places at once! 🌌
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0" />
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex-shrink-0" />
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none text-sm text-slate-300 font-medium animate-pulse">
                    IntelliBot is typing...
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/5 border-t border-white/5">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ask anything..." 
                    disabled
                    className="w-full pl-6 pr-14 py-4 bg-slate-900 border border-white/10 rounded-2xl text-sm focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FaPaperPlane className="text-white text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Decorative floating card */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 -left-10 z-20 p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4"
          >
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <FaCheckCircle className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase">Concept Mastered</div>
              <div className="text-xs font-bold text-white">Quantum Entanglement</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
