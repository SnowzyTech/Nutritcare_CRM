'use client';

import React, { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';

interface PrescriptionEditorProps {
  initialValue?: string;
  readOnly?: boolean;
}

export function PrescriptionEditor({ initialValue = 'No prescription provided.', readOnly = false }: PrescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [tempValue, setTempValue] = useState(initialValue);

  const handleSave = () => {
    setValue(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  return (
    <div className="bg-[#E0E0E0] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="px-6 py-2 bg-gray-300 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Prescription
      </div>
      <div className="p-6 bg-[#F5F5F5] min-h-[100px] flex items-start justify-between gap-6">
        {!readOnly && isEditing ? (
          <div className="flex-1 space-y-4">
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[120px] shadow-inner"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
              >
                <Check size={14} />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
              {value}
            </p>
            {!readOnly && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-[10px] font-bold hover:text-[#A020F0] hover:border-[#A020F0] transition-all flex items-center gap-2 shadow-sm"
              >
                <Edit3 size={12} />
                Edit
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
