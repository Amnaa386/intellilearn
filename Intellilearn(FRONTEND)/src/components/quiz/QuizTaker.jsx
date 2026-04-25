'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuizResults from './QuizResults';

export default function QuizTaker({ quizId, generatedTopic, onBack }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes for university level
  const [isFinished, setIsFinished] = useState(false);

  const quizData = {
    'generated': [
      { id: 'g1', question: `What is the primary significance of ${generatedTopic || 'this topic'} in its respective field?`, options: ['It provides a foundational framework', 'It has been largely replaced by newer theories', 'It is only relevant for introductory students', 'It has no practical application'], correct: 0 },
      { id: 'g2', question: `Which of the following is a key characteristic of ${generatedTopic || 'this topic'}?`, options: ['Static nature', 'Interdisciplinary integration', 'Limited historical context', 'Simplified methodology'], correct: 1 },
      { id: 'g3', question: `How does ${generatedTopic || 'this topic'} impact current research trends?`, options: ['It decreases research complexity', 'It serves as a catalyst for innovation', 'It is rarely cited in modern papers', 'It has no impact'], correct: 1 },
      { id: 'g4', question: `What is a common misconception about ${generatedTopic || 'this topic'}?`, options: ['It is easy to master', 'It is only theoretical', 'It is universally accepted', 'It is a recent discovery'], correct: 1 },
      { id: 'g5', question: `Future developments in ${generatedTopic || 'this topic'} are expected to focus on:`, options: ['Decreasing efficiency', 'Enhanced integration with AI', 'Reverting to traditional methods', 'Eliminating practical usage'], correct: 1 },
    ],
    '1': [ // Multivariable Calculus
      { id: 'm1', question: 'What is the physical interpretation of the divergence of a vector field?', options: ['The tendency of the field to rotate', 'The net flux per unit volume exiting a point', 'The rate of change in a specific direction', 'The potential energy at that point'], correct: 1 },
      { id: 'm2', question: 'In Stokes\' Theorem, the line integral of a vector field around a closed curve is equal to:', options: ['The flux of its curl through any surface bounded by the curve', 'The divergence of the field over the volume', 'The gradient of the scalar potential', 'Zero for all fields'], correct: 0 },
      { id: 'm3', question: 'A critical point of a function f(x,y) is a saddle point if the Hessian determinant is:', options: ['Positive', 'Negative', 'Zero', 'Complex'], correct: 1 },
      { id: 'm4', question: 'The Jacobian matrix is primarily used for:', options: ['Finding roots of equations', 'Linearizing non-linear transformations', 'Solving differential equations', 'Calculating eigenvalues'], correct: 1 },
      { id: 'm5', question: 'What does the Laplacian of a scalar field represent?', options: ['The average value of the field', 'The divergence of the gradient', 'The curl of the field', 'The total mass'], correct: 1 },
    ],
    '2': [ // Quantum Entanglement
      { id: 'p1', question: 'What does Bell\'s Theorem imply about local hidden variable theories?', options: ['They are consistent with quantum mechanics', 'They cannot reproduce the correlations predicted by QM', 'They are only valid for macroscopic systems', 'They explain entanglement perfectly'], correct: 1 },
      { id: 'p2', question: 'In the EPR paradox, "spooky action at a distance" refers to:', options: ['Faster than light communication', 'Non-local correlations between entangled particles', 'Gravity waves', 'Electromagnetic induction'], correct: 1 },
      { id: 'p3', question: 'Which quantum state is a maximally entangled state of two qubits?', options: ['|00>', '|11>', '(|00> + |11>) / √2', '|0>|1>'], correct: 2 },
      { id: 'p4', question: 'Quantum teleportation requires:', options: ['Physical transport of matter', 'Classical communication and shared entanglement', 'Only a quantum channel', 'Breaking the uncertainty principle'], correct: 1 },
      { id: 'p5', question: 'The "no-cloning theorem" states that:', options: ['Entanglement is impossible', 'An unknown quantum state cannot be copied perfectly', 'DNA cannot be cloned', 'Qubits must be identical'], correct: 1 },
    ],
    '3': [ // Organic Synthesis
      { id: 'c1', question: 'The Diels-Alder reaction is a [4+2] cycloaddition between:', options: ['A dienophile and a cation', 'A conjugated diene and a dienophile', 'Two alkenes', 'An alkyne and an alcohol'], correct: 1 },
      { id: 'c2', question: 'Which reagent is commonly used for the Swern oxidation of alcohols?', options: ['PCC', 'Oxalyl chloride and DMSO', 'KMnO4', 'LiAlH4'], correct: 1 },
      { id: 'c3', question: 'Retrosynthetic analysis involves:', options: ['Synthesizing a molecule forward', 'Breaking down a target molecule into simpler precursors', 'Calculating molecular weight', 'Measuring reaction rates'], correct: 1 },
      { id: 'c4', question: 'The Grignard reagent (RMgX) acts as a:', options: ['Strong electrophile', 'Strong nucleophile', 'Catalyst', 'Solvent'], correct: 1 },
      { id: 'c5', question: 'In an Sn2 reaction, the rate depends on:', options: ['Only the substrate', 'Only the nucleophile', 'Both the substrate and the nucleophile', 'Neither'], correct: 2 },
    ],
    '4': [ // Operating Systems
      { id: 'cs1', question: 'What is "Thrashing" in an operating system?', options: ['A process using too much CPU', 'High paging activity causing low CPU utilization', 'Hard drive failure', 'A bug in the kernel'], correct: 1 },
      { id: 'cs2', question: 'The "Banker\'s Algorithm" is used for:', options: ['Deadlock recovery', 'Deadlock avoidance', 'Memory allocation', 'File system security'], correct: 1 },
      { id: 'cs3', question: 'A "Context Switch" involves:', options: ['Changing the user of the system', 'Saving and restoring the state of a CPU for a process', 'Moving files between folders', 'Rebooting the OS'], correct: 1 },
      { id: 'cs4', question: 'Which scheduling algorithm is non-preemptive?', options: ['Round Robin', 'Shortest Job First (SJF)', 'Priority Scheduling', 'First-Come, First-Served (FCFS)'], correct: 3 },
      { id: 'cs5', question: 'The "Critical Section Problem" relates to:', options: ['Memory leaks', 'Mutual exclusion in concurrent processes', 'Disk partitioning', 'Network latency'], correct: 1 },
    ],
    '5': [ // Molecular Genetics
      { id: 'b1', question: 'Okazaki fragments are synthesized on:', options: ['The leading strand', 'The lagging strand', 'Both strands', 'The mRNA strand'], correct: 1 },
      { id: 'b2', question: 'The role of the TATA box in eukaryotes is:', options: ['To mark the start of translation', 'To serve as a promoter element for transcription', 'To terminate DNA replication', 'To bind ribosomes'], correct: 1 },
      { id: 'b3', question: 'CRISPR-Cas9 is a technology used for:', options: ['Protein sequencing', 'Targeted genome editing', 'Measuring cell respiration', 'Electron microscopy'], correct: 1 },
      { id: 'b4', question: 'Which enzyme is responsible for "charging" tRNA molecules?', options: ['RNA Polymerase', 'Aminoacyl-tRNA synthetase', 'DNA Ligase', 'Helicase'], correct: 1 },
      { id: 'b5', question: 'Alternative splicing allows for:', options: ['Multiple proteins from a single gene', 'Faster DNA replication', 'DNA repair', 'Cell division'], correct: 0 },
    ],
    '6': [ // Critical Theory
      { id: 'e1', question: 'Which theorist is most associated with the concept of "Hegemony"?', options: ['Michel Foucault', 'Antonio Gramsci', 'Jacques Derrida', 'Karl Marx'], correct: 1 },
      { id: 'e2', question: 'Deconstruction is a method of analysis primarily associated with:', options: ['Structuralism', 'Post-structuralism', 'Modernism', 'Realism'], correct: 1 },
      { id: 'e3', question: 'The "Panopticon" is a metaphor for surveillance used by:', options: ['Sigmund Freud', 'Michel Foucault', 'Judith Butler', 'Edward Said'], correct: 1 },
      { id: 'e4', question: 'Post-colonial theory often examines:', options: ['The internal structure of atoms', 'The legacy of colonial rule and cultural representation', 'Shakespearean sonnets', 'Grammar rules'], correct: 1 },
      { id: 'e5', question: 'The "Death of the Author" is an essay by:', options: ['T.S. Eliot', 'Roland Barthes', 'Virginia Woolf', 'James Joyce'], correct: 1 },
    ]
  };

  const questions = quizData[quizId] || quizData['1']; // Fallback to Math if quizId not found


  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSelectAnswer = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsFinished(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (isFinished) {
    return <QuizResults score={calculateScore()} totalQuestions={questions.length} onBack={onBack} />;
  }

  const question = questions[currentQuestion];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Question {currentQuestion + 1} of {questions.length}</h1>
          <div className="w-full h-2 rounded-full bg-slate-700/50 mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Clock className="w-5 h-5 text-red-400" />
          <span className="text-lg font-bold text-red-400">{formatTime(timeLeft)}</span>
        </div>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-8 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 mb-6"
        >
          <h2 className="text-2xl font-bold text-slate-100 mb-8">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSelectAnswer(question.id, idx)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswers[question.id] === idx
                    ? 'bg-blue-500/20 border-blue-500 text-blue-100'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[question.id] === idx
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-600'
                  }`}>
                    {selectedAnswers[question.id] === idx && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-lg">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {questions.map((q, idx) => (
            <motion.button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                idx === currentQuestion
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                  : selectedAnswers[q.id] !== undefined
                  ? 'bg-slate-800/50 border border-green-500/50 text-green-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
              }`}
            >
              {idx + 1}
            </motion.button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleFinish}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Finish Quiz
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
