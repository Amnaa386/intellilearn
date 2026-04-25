/**
 * Frontend-only mock quiz structured from a chat session (no fixed subjects).
 */

export const WRITTEN_MIN_CHARS = 40;
export const MAX_HINTS_PER_WRITTEN = 2;

function clip(s, n = 80) {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

const MCQ_BLOCK = (ctx) => [
  {
    id: 'cq1',
    type: 'mcq',
    question: `Looking back at your chat (preview: "${ctx}"), what is the most reliable first step when you are stuck on a concept the tutor explained?`,
    options: [
      'Skip ahead to unrelated topics',
      'Restate the idea in your own words and point to what confuses you',
      'Memorize definitions without examples',
      'Avoid revisiting earlier messages',
    ],
    correct: 1,
  },
  {
    id: 'cq2',
    type: 'mcq',
    question: 'Which habit best supports learning from an AI chat thread over time?',
    options: [
      'Only reading the last assistant message',
      'Saving key takeaways and questions you still have',
      'Asking shorter prompts with no context',
      'Closing the chat before reflecting',
    ],
    correct: 1,
  },
  {
    id: 'cq3',
    type: 'mcq',
    question: 'When the tutor gives a step-by-step explanation, what should you verify before moving on?',
    options: [
      'Whether each step follows logically from the previous one',
      'The color of the UI only',
      'How fast the reply arrived',
      'The length of the tutor message only',
    ],
    correct: 0,
  },
  {
    id: 'cq4',
    type: 'mcq',
    question: 'If your question in this chat was ambiguous, what is the best way to get a precise answer next time?',
    options: [
      'Repeat the same prompt verbatim',
      'Add constraints: goal, level, and what you already tried',
      'Send random keywords',
      'Ask for unrelated trivia',
    ],
    correct: 1,
  },
  {
    id: 'cq5',
    type: 'mcq',
    question: `Given your discussion context ("${ctx}"), what is the clearest way to state the main purpose of that thread?`,
    options: [
      'A vague title with no reference to what you wanted to learn',
      'A one-line goal that names the topic and what "done" looks like',
      'Only a paste of unrelated text',
      'A request with no constraints or level stated',
    ],
    correct: 1,
  },
  {
    id: 'cq6',
    type: 'mcq',
    question: 'Which follow-up question pattern usually produces the deepest learning in an AI tutor chat?',
    options: [
      'Ask for "everything" at once',
      'Ask what would change your mind and request a concrete check you can perform',
      'Ask the model to guess your intent with no details',
      'Ask for unrelated trivia',
    ],
    correct: 1,
  },
];

/**
 * @param {{ preview?: string }} session
 * @param {'mcq' | 'written'} mode
 * @returns {Array<{
 *   id: string,
 *   type: 'mcq' | 'written',
 *   question: string,
 *   options?: string[],
 *   correct?: number,
 *   minLength?: number,
 *   hintPool?: string[],
 * }>}
 */
export function generateQuizQuestionsFromSession(session, mode = 'mcq') {
  const preview = session?.preview || 'your recent conversation with the AI tutor';
  const ctx = clip(preview, 100);

  if (mode === 'mcq') {
    return MCQ_BLOCK(ctx);
  }

  return [
    {
      id: 'wq1',
      type: 'written',
      minLength: WRITTEN_MIN_CHARS,
      question: `Reflecting on your chat preview ("${ctx}"), describe the most reliable first step when you are stuck on a concept the tutor explained. Say why it works in your own words (2–4 sentences).`,
      hintPool: [
        'Split your answer: first name the step, then name the confusion it reduces.',
        'Point to one detail you would re-read in the thread—do not paste the whole message.',
      ],
    },
    {
      id: 'wq2',
      type: 'written',
      minLength: WRITTEN_MIN_CHARS,
      question: 'Explain one habit that helps you learn from an AI chat over several days, and how you would notice it is working.',
      hintPool: [
        'Use a before/after contrast: what you used to do vs what you do now.',
        'Name one artifact you keep (note, bookmark, summary) rather than naming a feature.',
      ],
    },
    {
      id: 'wq3',
      type: 'written',
      minLength: WRITTEN_MIN_CHARS,
      question: 'When a tutor gives a step-by-step explanation, what do you check before moving on? Give a short example of a "check" you would run.',
      hintPool: [
        'Think "logic chain": what must be true if step 2 is right?',
        'Your example can be hypothetical—keep it one sentence.',
      ],
    },
    {
      id: 'wq4',
      type: 'written',
      minLength: WRITTEN_MIN_CHARS,
      question: 'If your last prompt was ambiguous, how would you rewrite it with clearer constraints? Write the improved prompt (not the tutor reply).',
      hintPool: [
        'Include at least two constraints: audience/level and what you already tried.',
        'Avoid asking for "everything"; pick one outcome you want from the next reply.',
      ],
    },
    {
      id: 'wq5',
      type: 'written',
      minLength: WRITTEN_MIN_CHARS,
      question: `In your own words, what is the main question or goal that drove your discussion summarized as: "${ctx}"? Be specific about what "success" means for you.`,
      hintPool: [
        'Name the skill or decision you are trying to improve, not only the topic label.',
        'If the preview is broad, narrow to one measurable sub-goal.',
      ],
    },
    {
      id: 'wq6',
      type: 'written',
      minLength: WRITTEN_MIN_CHARS,
      question: 'Write one follow-up question you would ask the tutor next to deepen understanding. Explain what gap it targets in one sentence.',
      hintPool: [
        'Make the follow-up request a single question mark, not a list of ten asks.',
        'Say what you still cannot do after the last explanation.',
      ],
    },
  ];
}

/**
 * Controlled hint: short, process-focused; does not restate a model answer.
 * @returns {string | null}
 */
export function getWrittenHint(question, hintsUsed) {
  const pool = question?.hintPool || [];
  if (hintsUsed >= MAX_HINTS_PER_WRITTEN || hintsUsed >= pool.length) return null;
  return pool[hintsUsed] || null;
}

const VAGUE = /\b(thing|stuff|things|idk|whatever|basically|very\s+good|just)\b/gi;

/**
 * Mock "AI" evaluation — highlights weak phrasing, nudges thinking, never dumps a full exemplar answer.
 * @returns {{
 *   quality: number,
 *   bullets: string[],
 *   highlights: Array<{ start: number, end: number, label: string }>,
 *   meetsLength: boolean,
 * }}
 */
export function evaluateWrittenAnswer(question, rawText) {
  const text = (rawText || '').trim();
  const minLen = question?.minLength ?? WRITTEN_MIN_CHARS;
  const highlights = [];
  const bullets = [];
  let quality = 0.35;

  const meetsLength = text.length >= minLen;

  if (!meetsLength) {
    bullets.push(`Add more of your own reasoning — aim for at least ${minLen} characters before moving on.`);
    quality = 0.25;
  } else {
    quality = 0.52;
    if (/because|therefore|so that|which means/i.test(text)) quality += 0.12;
    if (/\?/.test(text)) quality += 0.04;
    if (text.length > minLen + 60) quality += 0.08;
    bullets.push('Structure looks workable — tighten any sentence that could apply to any topic.');
  }

  let m;
  const re = new RegExp(VAGUE.source, VAGUE.flags);
  while ((m = re.exec(text)) !== null) {
    highlights.push({
      start: m.index,
      end: m.index + m[0].length,
      label: 'Vague phrasing',
    });
  }
  if (highlights.length) {
    bullets.push('Replace vague fillers with concrete nouns or a specific example from your situation.');
    quality -= 0.06 * Math.min(highlights.length, 3);
  }

  if (meetsLength && /^(yes|no|ok|sure|idk)\.?$/i.test(text)) {
    bullets.push('Expand beyond a one-word reply — connect back to your chat goal.');
    quality = Math.min(quality, 0.38);
  }

  quality = Math.max(0, Math.min(1, quality));
  return { quality, bullets, highlights, meetsLength };
}

/**
 * @param {Array<{ id: string, type: string, correct?: number }>} questions
 * @param {Record<string, unknown>} answers
 * @param {{ writtenById?: Record<string, { evaluated?: boolean, quality?: number }> }} meta
 */
export function scoreChatQuiz(questions, answers, meta = {}) {
  const writtenById = meta.writtenById || {};
  const mcq = questions.filter((q) => q.type === 'mcq');
  const written = questions.filter((q) => q.type === 'written');
  const mcqWeight = mcq.length ? 70 / mcq.length : 0;
  const writtenWeight = written.length ? 30 / written.length : 0;

  let points = 0;
  mcq.forEach((q) => {
    if (answers[q.id] === q.correct) points += mcqWeight;
  });

  written.forEach((q) => {
    const metaRow = writtenById[q.id];
    if (!metaRow?.evaluated) return;
    const qn = typeof metaRow.quality === 'number' ? metaRow.quality : 0.5;
    points += writtenWeight * Math.max(0, Math.min(1, qn));
  });

  return Math.min(100, Math.round(points));
}

export function buildResultFeedback(score) {
  const suggestions = [];
  if (score >= 85) {
    suggestions.push('Strong grasp of how to use your chat context—try teaching a friend the same ideas.');
    suggestions.push('Next: export key points from the thread into notes for spaced review.');
  } else if (score >= 70) {
    suggestions.push('Re-read the tutor messages you marked as unclear and ask one targeted follow-up.');
    suggestions.push('Practice summarizing each assistant reply in a single sentence.');
  } else {
    suggestions.push('Spend a few minutes restating the chat preview in your own words before retrying.');
    suggestions.push('Use the AI Tutor to clarify definitions you mixed up, then retake the quiz.');
  }
  return {
    headline:
      score >= 85
        ? 'Excellent work'
        : score >= 70
          ? 'Good progress'
          : 'Room to grow',
    summary:
      score >= 85
        ? 'You connected the conversation context to solid study habits.'
        : score >= 70
          ? 'You are on track—tighten reflection and follow-ups to push higher.'
          : 'Focus on clarity and follow-up questions tied to your chat thread.',
    suggestions,
  };
}
