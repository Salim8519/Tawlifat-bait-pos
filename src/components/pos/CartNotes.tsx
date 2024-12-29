import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';

interface Props {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function CartNotes({ notes, onNotesChange }: Props) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [showNotes, setShowNotes] = useState(Boolean(notes));

  return (
    <div className="border-t p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{t.cartNotes}</span>
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`text-sm text-indigo-600 hover:text-indigo-800 ${showNotes ? 'font-medium' : ''}`}
        >
          {showNotes ? t.hideNotes : t.showNotes}
        </button>
      </div>

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t.addCartNotes}
          rows={3}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
      )}
    </div>
  );
}