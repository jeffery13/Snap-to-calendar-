import { useState } from 'react';

export default function TextInput({ onSubmit }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    onSubmit(text);
    setText('');
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') handleSubmit();
        }}
        placeholder={`Paste event details here…\nExample: Dinner tomorrow at 7pm at Ponce City Market with Alex and Sarah`}
        className="w-full px-4 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-slate-600 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all text-white placeholder-slate-500 resize-none h-24 font-light"
      />
      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold transition-colors"
      >
        Parse Event Details
      </button>
    </div>
  );
}
