'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, FileText, Presentation, Trash2 } from 'lucide-react';
import { deletePresentation, getPresentations } from '@/lib/presentationsApi';

export default function PresentationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [flashMessage, setFlashMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (!location.state?.successMessage) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!flashMessage) return undefined;
    const id = setTimeout(() => setFlashMessage(''), 2200);
    return () => clearTimeout(id);
  }, [flashMessage]);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getPresentations(1, 100);
        setItems(data?.presentations || []);
      } catch (error) {
        console.error('Failed to fetch presentations:', error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items],
  );

  const groupedPresentations = useMemo(() => {
    return sortedItems.reduce((acc, item) => {
      const createdTimestamp = new Date(item.createdAt).getTime() || Date.now();
      const d = new Date(createdTimestamp);
      const dateKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [sortedItems]);

  const sortedDateKeys = useMemo(
    () => Object.keys(groupedPresentations).map(Number).sort((a, b) => b - a),
    [groupedPresentations],
  );

  const formatDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDateGroupLabel = (dateKey) => {
    const exactDate = new Date(dateKey).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((startOfToday.getTime() - dateKey) / 86400000);
    if (diffDays === 0) return `Today • ${exactDate}`;
    if (diffDays === 1) return `Yesterday • ${exactDate}`;
    return new Date(dateKey).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDelete = async (id) => {
    if (!id || deletingId) return;
    setDeletingId(id);
    try {
      await deletePresentation(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete presentation:', error);
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-8 space-y-5">
        <div>
          <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/5" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="rounded-2xl border border-slate-700/60 bg-[#0d1333] p-5">
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-5 w-52 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-white/5" />
              <div className="mt-4 h-3 w-28 animate-pulse rounded bg-white/5" />
              <div className="mt-5 flex gap-2">
                <div className="h-7 w-24 animate-pulse rounded-lg bg-white/10" />
                <div className="h-7 w-20 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedItems.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-slate-900 p-5">
          <Presentation className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white">No presentations yet</h2>
        <p className="text-sm text-slate-400">Generate PPT from AI Tutor chat and it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Your Presentations</h1>
        {flashMessage ? (
          <p className="mt-2 text-sm text-emerald-400">{flashMessage}</p>
        ) : null}
        <p className="mt-1 text-sm text-slate-400">All generated PPT files are listed here. Download anytime.</p>
      </div>

      {sortedDateKeys.map((dateKey) => (
        <div key={dateKey} className="mb-7">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <h3 className="text-sm font-semibold text-slate-200">{getDateGroupLabel(dateKey)}</h3>
            <span className="text-xs text-slate-400">
              {groupedPresentations[dateKey].length} presentation{groupedPresentations[dateKey].length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groupedPresentations[dateKey].map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-700/60 bg-[#0d1333] p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-300">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{item.slideCount || 0} slides</span>
                </div>
                <h3 className="line-clamp-2 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.topic}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>

                <div className="mt-4 flex items-center gap-2">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
