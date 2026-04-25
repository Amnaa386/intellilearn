/**
 * Client-side structured learning material for the AI Tutor.
 * Parses lightweight intent from the user's message (counts, emphasis) and
 * builds a consistent pack. Replace with API/LLM output when backend is ready.
 */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function firstLineTopic(raw) {
  const t = (raw || '').trim().split(/\n|;|•/)[0].trim();
  if (t.length > 140) return `${t.slice(0, 137)}…`;
  return t || 'your topic';
}

/**
 * @param {string} userInput
 * @returns {{
 *   topicDisplay: string,
 *   mcqCount: number,
 *   shortQCount: number,
 *   longQCount: number,
 *   noteDepth: 'compact' | 'normal' | 'deep',
 *   includeShortNotes: boolean,
 *   includeDetailedNotes: boolean,
 *   includeShortQuestions: boolean,
 *   includeMcqs: boolean,
 *   includeLongQuestions: boolean,
 * }}
 */
export function analyzeLearningRequest(userInput) {
  const text = (userInput || '').toLowerCase();
  const topicDisplay = firstLineTopic(userInput);

  let mcqCount = 4;
  let shortQCount = 4;
  let longQCount = 2;

  const numMcq = text.match(/(\d+)\s*(mcq|mcqs|multiple\s*choice)/);
  if (numMcq) mcqCount = clamp(parseInt(numMcq[1], 10), 1, 20);

  const numShort = text.match(/(\d+)\s*(short\s*q|short\s*questions?)/);
  if (numShort) shortQCount = clamp(parseInt(numShort[1], 10), 1, 25);

  const numLong = text.match(/(\d+)\s*(long\s*q|long\s*questions?|essay)/);
  if (numLong) longQCount = clamp(parseInt(numLong[1], 10), 1, 12);

  if (/\b(more|extra|additional)\s+mcq/.test(text)) mcqCount = clamp(mcqCount + 4, 1, 20);
  if (/\b(more|extra|additional)\s+short/.test(text)) shortQCount = clamp(shortQCount + 3, 1, 25);
  if (/\b(more|extra|additional)\s+long/.test(text)) longQCount = clamp(longQCount + 2, 1, 12);

  let noteDepth = 'normal';
  if (/\b(deep|thorough|in[\s-]?depth|comprehensive|university|advanced)\b/.test(text)) noteDepth = 'deep';
  if (/\b(brief|quick|overview|summary\s+only|tl;?dr)\b/.test(text)) noteDepth = 'compact';

  const notesOnly =
    /\b(only\s+notes|just\s+notes|notes\s+only|no\s+questions)\b/.test(text) ||
    /\b(summary|revision\s+notes)\b/.test(text);

  const mcqOnly = /\b(only\s+mcq|mcqs?\s+only|multiple\s*choice\s+only)\b/.test(text);
  const examHeavy = /\b(exam|test\s+prep|board|objective|practice\s+paper)\b/.test(text);

  if (examHeavy) {
    mcqCount = clamp(mcqCount + 2, 1, 20);
    shortQCount = clamp(shortQCount + 2, 1, 25);
  }

  let includeShortNotes = true;
  let includeDetailedNotes = true;
  let includeShortQuestions = true;
  let includeMcqs = true;
  let includeLongQuestions = true;

  if (notesOnly) {
    includeShortQuestions = false;
    includeMcqs = false;
    includeLongQuestions = false;
    includeDetailedNotes = noteDepth !== 'compact';
  }

  if (mcqOnly) {
    includeShortQuestions = false;
    includeLongQuestions = false;
    includeDetailedNotes = false;
    includeShortNotes = true;
    mcqCount = clamp(mcqCount + 2, 1, 20);
  }

  return {
    topicDisplay,
    mcqCount,
    shortQCount,
    longQCount,
    noteDepth,
    includeShortNotes,
    includeDetailedNotes,
    includeShortQuestions,
    includeMcqs,
    includeLongQuestions,
  };
}

function shortNoteBullets(topic) {
  return [
    `${topic} — start by defining what problem or idea it belongs to, and what a learner should be able to do after studying it.`,
    `Link new vocabulary to one concrete example so terms stay memorable.`,
    `Self-check: restate the core claim in one sentence without copying a textbook definition verbatim.`,
  ];
}

function detailedSections(topic, depth) {
  const extra =
    depth === 'deep'
      ? [
          {
            heading: 'Common misconceptions',
            body: `Students often confuse surface features of "${topic}" with its underlying mechanism. Separate what you observe from what must be true for the explanation to hold.`,
            examples: [
              'Contrast a "looks similar" case with a true counterexample.',
              'State one assumption your textbook makes and what changes if you relax it.',
            ],
          },
        ]
      : [];

  return [
    {
      heading: `What "${topic}" means`,
      body: `Here we treat "${topic}" as the focal concept for this study block. A crisp definition names the object of study, the setting it applies to, and the boundary where the idea stops being useful.`,
      examples: [
        'Write a one-line definition in your own words.',
        'Give one everyday analogy and one technical analogy.',
      ],
    },
    {
      heading: 'Why it matters',
      body: 'Understanding the purpose behind the concept helps you prioritize facts: some details support the main mechanism; others are historical or contextual.',
      examples: ['List two exam-style skills this topic usually tests.'],
    },
    {
      heading: 'Step-by-step mental model',
      body: '1) Identify inputs and outputs. 2) Trace one worked path slowly. 3) Try a variant with one parameter changed. 4) Summarize invariants that stayed true.',
      examples: depth === 'deep' ? ['Derive or justify one key step explicitly.'] : [],
    },
    ...extra,
  ];
}

function buildShortQuestions(topic, n) {
  const pool = [
    `State one precise definition related to "${topic}" suitable for a short-answer exam.`,
    `Give one real-world application of "${topic}" in two sentences or fewer.`,
    `What is the main limitation or assumption students usually forget when studying "${topic}"?`,
    `Compare "${topic}" to the closest related idea you know: what is one similarity and one difference?`,
    `What would you check first if a problem mentions "${topic}" but the numbers look inconsistent?`,
    `Name one quick self-test you could perform to verify you understood "${topic}" correctly.`,
    `In one sentence, explain why "${topic}" is taught in your course sequence (what prerequisite it builds on).`,
    `List two key terms for "${topic}" and use each in a sentence that shows meaning, not memorization.`,
  ];
  return pool.slice(0, clamp(n, 1, pool.length));
}

function buildLongQuestions(topic, n) {
  const pool = [
    {
      question: `Develop a structured essay plan for "${topic}": introduction, three body themes, and conclusion. For each body theme, name evidence or reasoning you would include.`,
      guidance: 'Aim for exam-style structure: claim → reasoning → mini-example.',
    },
    {
      question: `Analyze a scenario where "${topic}" succeeds versus one where it fails or is misapplied. What distinguishes the two cases?`,
      guidance: 'Use headings; end with implications for study or practice.',
    },
    {
      question: `Teach "${topic}" to a peer who missed the lecture. Write an outline that moves from intuition to formal detail.`,
      guidance: 'Include at least one diagram description (what to draw) even if you only describe it in words.',
    },
    {
      question: `Critically evaluate one common textbook explanation of "${topic}". What is strong, what is missing, and how would you improve it?`,
      guidance: 'Reference specific steps or claims, not vague criticism.',
    },
  ];
  return pool.slice(0, clamp(n, 1, pool.length));
}

const MCQ_TEMPLATES = (topic) => [
  {
    q: `For studying "${topic}", which habit most directly improves retention?`,
    opts: [
      'Passive re-reading only',
      'Active recall with spaced repetition',
      'Highlighting without self-testing',
      'Cramming the night before only',
    ],
    correct: 1,
  },
  {
    q: `When a problem involves "${topic}", what is the best first diagnostic step?`,
    opts: [
      'Jump to the final formula immediately',
      'Identify knowns, unknowns, and the governing principle',
      'Ignore units and notation',
      'Guess an answer and work backwards blindly',
    ],
    correct: 1,
  },
  {
    q: `Which statement about "${topic}" is most defensible in an academic answer?`,
    opts: [
      'It is unrelated to prerequisites',
      'It builds on definitions and constraints stated earlier in the course',
      'It can mean anything depending on mood',
      'It should never include examples',
    ],
    correct: 1,
  },
  {
    q: `If two explanations of "${topic}" disagree, what should you do first?`,
    opts: [
      'Pick the longer explanation automatically',
      'Compare assumptions, definitions, and the predictions each makes',
      'Assume both are equally wrong',
      'Avoid reading primary sources',
    ],
    correct: 1,
  },
  {
    q: `Which practice best deepens understanding of "${topic}"?`,
    opts: [
      'Memorize labels without using them in problems',
      'Explain the idea aloud, then solve a variant problem',
      'Copy solution steps without reasoning',
      'Avoid connecting to prior topics',
    ],
    correct: 1,
  },
  {
    q: `In exam conditions, a strong answer about "${topic}" typically:`,
    opts: [
      'Uses vague generalities',
      'States a thesis, supports it with structured reasoning, and checks edge cases',
      'Lists unrelated facts',
      'Omits definitions',
    ],
    correct: 1,
  },
  {
    q: `Time management while revising "${topic}" works best when you:`,
    opts: [
      'Study only one marathon block per month',
      'Use short focused sessions with specific goals and quick checks',
      'Avoid practice questions',
      'Skip planning',
    ],
    correct: 1,
  },
  {
    q: `A robust mental model of "${topic}" should let you:`,
    opts: [
      'Only recognize terminology',
      'Predict outcomes when inputs change slightly',
      'Ignore counterexamples',
      'Avoid explaining to others',
    ],
    correct: 1,
  },
];

/**
 * @param {string} userInput
 * @param {ReturnType<typeof analyzeLearningRequest>} [intent]
 */
export function generateLearningPack(userInput, intent = analyzeLearningRequest(userInput)) {
  const topic = intent.topicDisplay;
  const depth = intent.noteDepth;

  const shortNotes = intent.includeShortNotes ? shortNoteBullets(topic) : [];

  let detailedNotes = [];
  if (intent.includeDetailedNotes) {
    detailedNotes = detailedSections(topic, depth);
    if (depth === 'compact') {
      detailedNotes = detailedNotes.slice(0, 1);
    }
  }

  const shortQuestions = intent.includeShortQuestions ? buildShortQuestions(topic, intent.shortQCount) : [];

  const templates = MCQ_TEMPLATES(topic);
  const mcqs = [];
  if (intent.includeMcqs) {
    for (let i = 0; i < intent.mcqCount; i += 1) {
      const base = templates[i % templates.length];
      mcqs.push({
        id: `mcq-${i + 1}`,
        question: base.q,
        options: [...base.opts],
        correctIndex: base.correct,
      });
    }
  }

  const longQuestions = intent.includeLongQuestions ? buildLongQuestions(topic, intent.longQCount) : [];

  return {
    topic,
    intentSummary: {
      mcqCount: mcqs.length,
      shortQCount: shortQuestions.length,
      longQCount: longQuestions.length,
      noteDepth: depth,
    },
    shortNotes,
    detailedNotes,
    shortQuestions,
    mcqs,
    longQuestions,
  };
}
