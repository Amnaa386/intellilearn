import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    name: 'Aisha K.',
    text: 'IntelliLearn made studying so much easier! The AI tutor is like having a personal teacher 24/7.',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    name: 'Rahul S.',
    text: 'The quiz generator is amazing. I can practice anytime and get instant feedback.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Emily T.',
    text: 'I love the OCR notes scanner. No more typing my handwritten notes! Highly recommend.',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
  }
];

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="max-w-4xl mx-auto px-6 py-20 text-center relative">
      <h2 className="text-3xl md:text-4xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">What Our Users Say</h2>
      <div className="relative max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5 }}
            className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-blue-900/30 shadow-lg flex flex-col items-center gap-4 min-h-[220px]"
          >
            <img src={testimonials[index].avatar} alt={testimonials[index].name} className="w-16 h-16 rounded-full border-2 border-blue-400 mx-auto mb-2" />
            <div className="text-blue-100 font-semibold text-lg mb-1">{testimonials[index].name}</div>
            <div className="text-slate-300 text-base">“{testimonials[index].text}”</div>
          </motion.div>
        </AnimatePresence>
        
        <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 rounded-full bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition-all hidden md:block">
          <ChevronLeft />
        </button>
        <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 rounded-full bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition-all hidden md:block">
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
