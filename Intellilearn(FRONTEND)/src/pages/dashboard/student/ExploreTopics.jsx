'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  Code, 
  FlaskConical, 
  Globe, 
  Calculator, 
  History, 
  Music, 
  Palette,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Star,
  Clock,
  ArrowRight,
  Atom,
  TestTube,
  Cpu,
  Type
} from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/animations';

const subjects = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: <Calculator className="w-6 h-6 text-blue-400" />,
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    topics: [
      { id: 'm1', title: 'Calculus', lessons: 18, duration: '12h 45m', difficulty: 'Advanced', rating: 4.8, image: 'https://images.unsplash.com/photo-1509228468518-180dd48a579a?q=80&w=2070&auto=format&fit=crop', description: 'Multivariable calculus, vector analysis, and complex integration.' },
      { id: 'm2', title: 'Linear Algebra', lessons: 15, duration: '10h 30m', difficulty: 'Advanced', rating: 4.9, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop', description: 'Vector spaces, linear transformations, eigenvalues, and tensors.' },
      { id: 'm3', title: 'Differential Equations', lessons: 14, duration: '9h 15m', difficulty: 'Expert', rating: 4.7, image: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=2070&auto=format&fit=crop', description: 'Ordinary and partial differential equations with engineering applications.' },
      { id: 'm4', title: 'Numerical Analysis', lessons: 12, duration: '8h 20m', difficulty: 'Expert', rating: 4.6, image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=2070&auto=format&fit=crop', description: 'Computational methods for approximating mathematical solutions.' },
    ]
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: <Atom className="w-6 h-6 text-purple-400" />,
    color: 'from-purple-500/20 to-indigo-500/20',
    borderColor: 'border-purple-500/30',
    topics: [
      { id: 'p1', title: 'Quantum Mechanics', lessons: 22, duration: '16h 50m', difficulty: 'Expert', rating: 4.9, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop', description: 'Schrödinger equation, operator formalism, and quantum entanglement.' },
      { id: 'p2', title: 'Electromagnetism', lessons: 18, duration: '13h 15m', difficulty: 'Advanced', rating: 4.8, image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', description: 'Maxwell equations, electromagnetic waves, and radiation theory.' },
      { id: 'p3', title: 'Thermodynamics', lessons: 16, duration: '11h 40m', difficulty: 'Advanced', rating: 4.7, image: 'https://images.unsplash.com/photo-1532187863486-abf9d39d9995?q=80&w=2070&auto=format&fit=crop', description: 'Statistical mechanics, entropy, and thermodynamic potentials.' },
      { id: 'p4', title: 'Modern Physics', lessons: 14, duration: '9h 30m', difficulty: 'Advanced', rating: 4.7, image: 'https://images.unsplash.com/photo-1461532257246-777de18cd58b?q=80&w=2070&auto=format&fit=crop', description: 'Special relativity, particle physics, and nuclear structures.' },
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: <TestTube className="w-6 h-6 text-emerald-400" />,
    color: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
    topics: [
      { id: 'c1', title: 'Organic Chemistry', lessons: 24, duration: '18h 30m', difficulty: 'Advanced', rating: 4.8, image: 'https://images.unsplash.com/photo-1532187863486-abf9d39d9995?q=80&w=2070&auto=format&fit=crop', description: 'Stereochemistry, reaction mechanisms, and synthetic pathways.' },
      { id: 'c2', title: 'Physical Chemistry', lessons: 20, duration: '15h 15m', difficulty: 'Expert', rating: 4.7, image: 'https://images.unsplash.com/photo-1532187863486-abf9d39d9995?q=80&w=2070&auto=format&fit=crop', description: 'Chemical kinetics, quantum chemistry, and spectroscopy.' },
      { id: 'c3', title: 'Analytical Chemistry', lessons: 15, duration: '11h 45m', difficulty: 'Advanced', rating: 4.6, image: 'https://images.unsplash.com/photo-1532187863486-abf9d39d9995?q=80&w=2070&auto=format&fit=crop', description: 'Instrumental methods, chromatography, and mass spectrometry.' },
    ]
  },
  {
    id: 'cs',
    name: 'Computer Science',
    icon: <Cpu className="w-6 h-6 text-cyan-400" />,
    color: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/30',
    topics: [
      { id: 'cs1', title: 'Data Structures & Algorithms', lessons: 28, duration: '24h 20m', difficulty: 'Advanced', rating: 4.9, image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop', description: 'Graph algorithms, dynamic programming, and complexity theory.' },
      { id: 'cs2', title: 'Operating Systems', lessons: 18, duration: '14h 45m', difficulty: 'Advanced', rating: 4.8, image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop', description: 'Memory management, process scheduling, and file systems.' },
      { id: 'cs3', title: 'Computer Architecture', lessons: 16, duration: '12h 15m', difficulty: 'Advanced', rating: 4.7, image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop', description: 'Pipelining, instruction sets, and digital logic design.' },
      { id: 'cs4', title: 'Machine Learning', lessons: 24, duration: '20h 30m', difficulty: 'Expert', rating: 4.9, image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop', description: 'Neural networks, deep learning, and probabilistic modeling.' },
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: <FlaskConical className="w-6 h-6 text-pink-400" />,
    color: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/30',
    topics: [
      { id: 'b1', title: 'Molecular Biology', lessons: 20, duration: '15h 40m', difficulty: 'Expert', rating: 4.9, image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=2070&auto=format&fit=crop', description: 'Gene expression, protein engineering, and molecular cloning.' },
      { id: 'b2', title: 'Cell Biology', lessons: 16, duration: '12h 20m', difficulty: 'Advanced', rating: 4.8, image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=2070&auto=format&fit=crop', description: 'Cell signaling, membrane transport, and metabolic pathways.' },
      { id: 'b3', title: 'Biochemistry', lessons: 18, duration: '14h 10m', difficulty: 'Advanced', rating: 4.7, image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=2070&auto=format&fit=crop', description: 'Enzyme kinetics, structural biology, and metabolic regulation.' },
    ]
  },
  {
    id: 'english',
    name: 'English',
    icon: <Type className="w-6 h-6 text-amber-400" />,
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    topics: [
      { id: 'e1', title: 'Academic Writing', lessons: 15, duration: '10h 30m', difficulty: 'Intermediate', rating: 4.6, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2070&auto=format&fit=crop', description: 'Advanced research methodologies and formal academic discourse.' },
      { id: 'e2', title: 'Comparative Literature', lessons: 14, duration: '11h 15m', difficulty: 'Advanced', rating: 4.7, image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop', description: 'Cross-cultural literary analysis and thematic studies.' },
      { id: 'e3', title: 'Critical Theory', lessons: 12, duration: '9h 45m', difficulty: 'Advanced', rating: 4.6, image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop', description: 'Structuralism, post-structuralism, and literary criticism.' },
    ]
  }
];


export default function ExploreTopics() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedSubjects, setExpandedSubjects] = useState(['math', 'physics', 'chemistry', 'cs', 'biology', 'english']); // Default all expanded for 'All Topics'

  const categories = [
    { id: 'all', label: 'All Topics', icon: <BookOpen className="w-4 h-4" /> },
    ...subjects.map(s => ({ id: s.id, label: s.name, icon: s.icon }))
  ];

  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      // Re-expand all when switching to All Topics
      setExpandedSubjects(subjects.map(s => s.id));
    } else {
      // Expand the specific subject when selected
      setExpandedSubjects([catId]);
    }
  };

  const filteredSubjects = subjects.map(subject => ({
    ...subject,
    topics: subject.topics.filter(topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(subject => {
    const matchesCategory = activeCategory === 'all' || subject.id === activeCategory;
    return matchesCategory && subject.topics.length > 0;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen w-full px-4 md:px-8 py-8 md:py-12 bg-slate-950 text-slate-100"
    >
      {/* Header & Search */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
            >
              Academic Learning Library
            </motion.h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Explore our structured curriculum across all major disciplines. Click on a subject to see available topics.
            </p>
          </div>

          <div className="relative w-full lg:w-96 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search topics, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="max-w-7xl mx-auto mb-10 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex items-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl border transition-all whitespace-nowrap
                ${activeCategory === cat.id 
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}
              `}
            >
              <div className={activeCategory === cat.id ? 'text-blue-400' : 'text-slate-500'}>
                {cat.icon}
              </div>
              <span className="font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subjects List */}
      <div className="max-w-7xl mx-auto space-y-6">
        {filteredSubjects.map((subject) => (
          <motion.div
            key={subject.id}
            layout
            className={`rounded-3xl border ${subject.borderColor} bg-slate-900/20 backdrop-blur-sm overflow-hidden transition-all duration-300`}
          >
            {/* Subject Header */}
            <button 
              onClick={() => toggleSubject(subject.id)}
              className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${subject.color}`}>
                  {subject.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{subject.name}</h2>
                  <p className="text-sm text-slate-400">{subject.topics.length} Topics Available</p>
                </div>
              </div>
              <div className="p-2 rounded-full bg-slate-800 text-slate-400 group-hover:text-white transition-all">
                {expandedSubjects.includes(subject.id) ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </div>
            </button>

            {/* Topics Grid (Expandable) */}
            <AnimatePresence initial={false}>
              {expandedSubjects.includes(subject.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {subject.topics.map((topic) => (
                        <motion.div
                          key={topic.id}
                          variants={itemVariants}
                          initial="initial"
                          animate="animate"
                          whileHover={{ y: -8 }}
                          className="group bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all cursor-pointer"
                        >
                          <div className="h-32 overflow-hidden relative">
                            <img 
                              src={topic.image} 
                              alt={topic.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=2070&auto=format&fit=crop';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                            <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white">
                              {topic.difficulty}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{topic.title}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-slate-300">{topic.rating}</span>
                              </div>
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2 mb-4">{topic.description}</p>
                            <div className="flex items-center justify-between text-slate-500 border-t border-slate-800 pt-3">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-3 h-3" />
                                <span className="text-[10px]">{topic.lessons} Lessons</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px]">{topic.duration}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredSubjects.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="p-6 rounded-full bg-slate-900 mb-6">
              <Search className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">No results found</h3>
            <p className="text-slate-500">Try adjusting your search terms.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

