'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { getVideoLectures } from '@/lib/videoLecturesApi';

function formatGroupLabel(dateKey) {
  const dt = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const formatted = dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  if (sameDay(dt, today)) return `Today • ${formatted}`;
  if (sameDay(dt, yesterday)) return `Yesterday • ${formatted}`;
  return formatted;
}

export default function VideoLecturesPage() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (!flashMessage) return undefined;
    const id = setTimeout(() => setFlashMessage(''), 2200);
    return () => clearTimeout(id);
  }, [flashMessage]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getVideoLectures(1, 100);
        if (!mounted) return;
        setItems(data?.videoLectures || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load video lectures.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const key = new Date(item.createdAt).toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const sortedKeys = useMemo(
    () => Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)),
    [grouped],
  );

  if (loading) {
    return <div className="min-h-[45vh] animate-pulse rounded-2xl border border-white/10 bg-[#0d1333]/40" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Video Lectures</h1>
        <p className="text-sm text-slate-400">AI-generated lectures with selectable voice settings.</p>
        {flashMessage ? <p className="mt-2 text-xs text-emerald-400">{flashMessage}</p> : null}
        {error ? <p className="mt-2 text-xs text-amber-400">{error}</p> : null}
      </div>

      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
          No video lectures yet. Use "Generate Video Lecture" in AI Tutor.
        </div>
      ) : null}

      {sortedKeys.map((dateKey) => (
        <section key={dateKey} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">
            {formatGroupLabel(dateKey)} ({grouped[dateKey].length})
          </h3>
          <div className="grid gap-3">
            {grouped[dateKey].map((item) => (
              <motion.div key={item.id} layout className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400">
                      {item.topic} • {item.voiceStyle} • {item.voiceSpeed}x • {item.durationSec}s
                    </p>
                  </div>
                  <a href={item.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
                <video className="w-full rounded-xl border border-slate-700 bg-black" controls preload="metadata" src={item.videoUrl}>
                  Your browser does not support video playback.
                </video>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
