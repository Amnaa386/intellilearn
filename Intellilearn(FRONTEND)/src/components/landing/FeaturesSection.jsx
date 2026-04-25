import { motion } from 'framer-motion';
import { FaRobot, FaMagic, FaFileAlt, FaMicrophone, FaFilePowerpoint, FaStickyNote, FaBrain, FaSearch } from 'react-icons/fa';
import { Sparkles, Zap, MessageSquare, Headphones, FileText, Layout, Shield, PlayCircle, Brain } from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: 'AI Text Explanation',
    desc: 'Get deep, contextual breakdowns of any topic, synthesized by advanced AI to simplify complex academic concepts.'
  },
  {
    icon: <Headphones className="w-8 h-8" />,
    title: 'Voice Learning',
    desc: 'Listen to AI-generated audio lectures and guides, perfect for on-the-go study and auditory learners.'
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: 'Smart Notes',
    desc: 'Automatically generate structured, organized notes with key takeaways and definitions for every topic.'
  },
  {
    icon: <Layout className="w-8 h-8" />,
    title: 'PPT Generation',
    desc: 'Create structured presentation slides instantly. Our animated AI robot visually explains and presents your content for better understanding.'
  }
];


export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-6 overflow-hidden bg-[#0a0f2c]">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight"
          >
            Professional AI Features
          </motion.h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xl hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300 shadow-xl flex flex-col"
            >
              <div className="mb-6 p-4 rounded-xl bg-slate-950/80 w-fit group-hover:scale-110 transition-transform duration-500 border border-white/5 shadow-inner">
                <div className="text-blue-400">{f.icon}</div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-white group-hover:text-blue-400 transition-colors tracking-tight">
                {f.title}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm font-medium flex-grow">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}





