import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaRobot, FaCheckCircle } from 'react-icons/fa';

const steps = [
  {
    icon: <FaSearch className="w-6 h-6" />,
    title: 'Enter Your Topic',
    desc: 'Type any subject or academic topic you want to master in the search bar.',
    color: 'bg-blue-50'
  },
  {
    icon: <FaRobot className="w-6 h-6" />,
    title: 'Select Learning Mode',
    desc: 'Choose between Text, Voice, PPT, or Video lecture to suit your style.',
    color: 'bg-indigo-50'
  },
  {
    icon: <FaCheckCircle className="w-6 h-6" />,
    title: 'Receive AI Output',
    desc: 'Get instant, high-quality content synthesized by our advanced AI core.',
    color: 'bg-blue-50'
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#0a0f2c] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight"
          >
            How It Works
          </motion.h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[40px] left-[15%] w-[70%] h-[2px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 z-0" />
          
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ delay: i * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-[#0d1333] border border-white/10 flex items-center justify-center text-purple-400 shadow-2xl group-hover:border-purple-500/50 group-hover:scale-110 transition-all duration-500">
                  {step.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-xl bg-purple-600 border border-white/20 flex items-center justify-center text-xs font-black text-white shadow-xl">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-xl font-black mb-4 text-white tracking-tight">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium px-4">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}






