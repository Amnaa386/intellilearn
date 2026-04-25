import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="cta" className="py-24 px-6 bg-[#0a0f2c] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto bg-[#0d1333] rounded-[2rem] p-10 md:p-20 border border-white/10 text-center relative z-10 overflow-hidden shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Ready to Evolve?</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-black mb-6 text-white leading-tight tracking-tight">
            Join the Next Generation <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">of High-Achievers</span>
          </h2>
          
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-10 font-medium leading-relaxed">
            Experience the power of professional AI and transform your academic 
            journey today. Join thousands of students already learning faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth/register">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 transition-all flex items-center gap-3 border-none"
              >
                Start Learning
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
