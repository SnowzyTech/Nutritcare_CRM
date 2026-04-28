'use client';

import React from 'react';

type Status = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled' | 'Failed';

interface Step {
  label: string;
  active: boolean;
  color: 'yellow' | 'green' | 'orange' | 'red' | 'grey';
}

const STEP_CONFIGS: Record<Status, Step[]> = {
  Pending: [
    { label: 'Order is Pending', active: true, color: 'yellow' },
    { label: 'Order is yet to be Confirmed', active: false, color: 'grey' },
    { label: 'Order is yet to be Delivered', active: false, color: 'grey' },
  ],
  Confirmed: [
    { label: 'Order Processed', active: true, color: 'yellow' },
    { label: 'Order is has been comfirmed', active: true, color: 'green' },
    { label: 'Order is yet to Delivered', active: false, color: 'grey' },
  ],
  Cancelled: [
    { label: 'Order Processed', active: true, color: 'yellow' },
    { label: 'Order is has been Cancelled', active: true, color: 'orange' },
    { label: 'Order is yet to Delivered', active: false, color: 'grey' },
  ],
  Failed: [
    { label: 'Order Processed', active: true, color: 'yellow' },
    { label: 'Order is has been comfirmed', active: true, color: 'green' },
    { label: 'Order Failed', active: true, color: 'red' },
  ],
  Delivered: [
    { label: 'Order is Pending', active: true, color: 'yellow' },
    { label: 'Order is yet to be Confirmed', active: true, color: 'green' },
    { label: 'Order is has been Delivered', active: true, color: 'green' },
  ],
};

const COLOR_CLASSES = {
  yellow: 'bg-[#F2C94C]',
  green: 'bg-[#27AE60]',
  orange: 'bg-[#F2994A]',
  red: 'bg-[#EB5757]',
  grey: 'bg-[#E0E0E0]',
};

export function ProgressSteps({ status }: { status: Status }) {
  const steps = STEP_CONFIGS[status] || STEP_CONFIGS.Pending;

  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-16 relative">
      {/* Connecting Lines */}
      <div className="absolute top-5 left-10 right-10 h-[1px] bg-gray-100 -z-0" />
      
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center gap-4 relative z-10 w-1/3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${step.active ? COLOR_CLASSES[step.color] : 'bg-[#E0E0E0]'}`}>
            {i + 1}
          </div>
          <span className={`text-[10px] font-medium text-center max-w-[120px] leading-tight ${step.active ? 'text-gray-600' : 'text-gray-300'}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
