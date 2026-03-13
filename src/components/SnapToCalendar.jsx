import { useState, useRef } from 'react';
import {
  Upload,
  Calendar,
  Mail,
  Download,
  Check,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';
import TextInput from './TextInput';
import { parseEvent } from '../lib/eventParser';
import { downloadICS } from '../lib/icsGenerator';

// ─── Stages ──────────────────────────────────────────────────────────────────
// upload → extracting → review → invites → complete

export default function SnapToCalendar() {
  const [stage, setStage] = useState('upload');
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [guestInput, setGuestInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const extractEvent = async (input) => {
    setLoading(true);
    setError('');
    try {
      const data = await parseEvent(input);
      setEvent(data);
      setStage('review');
    } catch (err) {
      setError('Failed to extract event. Please try again.');
      console.error(err);
      setStage('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result?.split(',')[1];
      if (base64) {
        setStage('extracting');
        extractEvent({ type: 'image', data: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextInput = (text) => {
    if (!text.trim()) {
      setError('Please enter event details');
      return;
    }
    setStage('extracting');
    extractEvent({ type: 'text', data: text });
  };

  const addGuest = () => {
    const email = guestInput.trim();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }
    if (guests.includes(email)) {
      setError('Email already added');
      return;
    }

    setGuests([...guests, email]);
    setGuestInput('');
    setError('');
  };

  const removeGuest = (index) =>
    setGuests(guests.filter((_, i) => i !== index));

  const updateEvent = (field, value) =>
    setEvent((prev) => ({ ...prev, [field]: value }));

  const handleDownload = () => {
    downloadICS(event, guests);
    setStage('complete');
  };

  const reset = () => {
    setStage('upload');
    setEvent(null);
    setGuests([]);
    setGuestInput('');
    setError('');
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputCls =
    'w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 hover:border-teal-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all text-white placeholder-slate-500';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Snap-to-Calendar
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-light">
            Transform event info into calendar invites instantly
          </p>
        </header>

        {/* Stages */}
        <main className="flex-1 flex flex-col">
          {stage === 'upload' && (
            <UploadStage
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              onTextInput={handleTextInput}
              error={error}
            />
          )}

          {stage === 'extracting' && <ExtractingStage />}

          {stage === 'review' && event && (
            <ReviewStage
              event={event}
              onUpdate={updateEvent}
              onNext={() => setStage('invites')}
              onReset={reset}
              inputCls={inputCls}
            />
          )}

          {stage === 'invites' && event && (
            <InvitesStage
              event={event}
              guests={guests}
              guestInput={guestInput}
              error={error}
              onGuestInputChange={(v) => setGuestInput(v)}
              onAddGuest={addGuest}
              onRemoveGuest={removeGuest}
              onDownload={handleDownload}
              onDone={() => setStage('complete')}
              onBack={() => setStage('review')}
              inputCls={inputCls}
            />
          )}

          {stage === 'complete' && event && (
            <CompleteStage event={event} guests={guests} onReset={reset} />
          )}
        </main>

        <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>⚡ Snap-to-Calendar MVP · Extract → Review → Export in seconds</p>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}

// ─── Stage Components ─────────────────────────────────────────────────────────

function UploadStage({ fileInputRef, onFileUpload, onTextInput, error }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group p-8 border-2 border-dashed border-slate-600 rounded-2xl hover:border-teal-400 hover:bg-slate-900/50 transition-all duration-300 cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-xl bg-slate-800 group-hover:bg-teal-500/10 transition-colors">
            <Upload className="w-8 h-8 text-teal-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Upload Screenshot or Photo</p>
            <p className="text-sm text-slate-400 mt-1">
              Email, flyer, social post, or anything with event info
            </p>
          </div>
        </div>
      </div>

      <TextInput onSubmit={onTextInput} />

      {error && <ErrorBanner message={error} />}
    </div>
  );
}

function ExtractingStage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">Extracting event details…</p>
        <p className="text-sm text-slate-400 mt-2">Using AI to parse your information</p>
      </div>
    </div>
  );
}

function ReviewStage({ event, onUpdate, onNext, onReset, inputCls }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-teal-400">Review Your Event</h2>

        <div className="space-y-5">
          <Field label="Event Title">
            <input
              type="text"
              value={event.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <input
                type="date"
                value={event.date}
                onChange={(e) => onUpdate('date', e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start">
                <input
                  type="time"
                  value={event.startTime}
                  onChange={(e) => onUpdate('startTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="End">
                <input
                  type="time"
                  value={event.endTime}
                  onChange={(e) => onUpdate('endTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <Field label="Location">
            <input
              type="text"
              value={event.location}
              onChange={(e) => onUpdate('location', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={event.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Add to Calendar
        </button>
        <button
          onClick={onReset}
          className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-semibold transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

function InvitesStage({
  event,
  guests,
  guestInput,
  error,
  onGuestInputChange,
  onAddGuest,
  onRemoveGuest,
  onDownload,
  onDone,
  onBack,
  inputCls,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Event summary */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400">Event Ready</p>
            <h3 className="text-2xl font-bold text-white mt-1">{event.title}</h3>
          </div>
          <Calendar className="w-6 h-6 text-teal-400" />
        </div>
        <div className="space-y-1 text-sm text-slate-400">
          <p>📅 {event.date} at {event.startTime}</p>
          {event.location && <p>📍 {event.location}</p>}
        </div>
      </div>

      {/* Guest management */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-teal-400" />
          Add Guests <span className="text-slate-500 font-normal text-sm">(Optional)</span>
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={guestInput}
            onChange={(e) => onGuestInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddGuest()}
            placeholder="Enter email address…"
            className={`flex-1 ${inputCls}`}
          />
          <button
            onClick={onAddGuest}
            className="px-4 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>

        {guests.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-400 mb-3">Added guests:</p>
            {guests.map((email, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-700"
              >
                <span className="text-sm">{email}</span>
                <button
                  onClick={() => onRemoveGuest(idx)}
                  className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} small />
          </div>
        )}
      </div>

      {/* Export */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-teal-400" />
          Export Options
        </h3>
        <button
          onClick={onDownload}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Calendar File (.ics)
        </button>
        <p className="text-xs text-slate-400 text-center mt-3">
          💡 Opens with Apple Calendar, Google Calendar, or Outlook
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-semibold transition-colors"
        >
          Back
        </button>
        <button
          onClick={onDone}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Done
        </button>
      </div>
    </div>
  );
}

function CompleteStage({ event, guests, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 animate-fadeIn">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600">
          <Check className="w-10 h-10 text-white" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">All Set!</h2>
        <p className="text-slate-400 mb-6">Your event is ready to add to your calendar</p>

        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 mb-8 text-left">
          <p className="font-semibold text-lg mb-3">{event.title}</p>
          <div className="space-y-2 text-sm text-slate-400">
            <p>📅 {event.date} · {event.startTime}</p>
            {event.location && <p>📍 {event.location}</p>}
            {guests.length > 0 && (
              <p>👥 {guests.length} guest{guests.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        Create Another Event
      </button>
    </div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 block mb-2">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message, small = false }) {
  return (
    <div
      className={`p-${small ? '3' : '4'} rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3`}
    >
      <AlertCircle className={`w-${small ? '4' : '5'} h-${small ? '4' : '5'} text-red-400 flex-shrink-0 mt-0.5`} />
      <p className={`text-${small ? 'xs' : 'sm'} text-red-300`}>{message}</p>
    </div>
  );
}
