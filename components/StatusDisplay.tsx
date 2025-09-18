
import React from 'react';
import { ConversionStatus } from '../types';
import Spinner from './Spinner';

interface StatusDisplayProps {
  status: ConversionStatus;
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const DotIcon = () => (
    <div className="h-6 w-6 flex items-center justify-center">
      <div className="h-2 w-2 rounded-full bg-slate-500"></div>
    </div>
);


const Step: React.FC<{ title: string; isActive: boolean; isCompleted: boolean; }> = ({ title, isActive, isCompleted }) => {
    return (
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
                {isCompleted ? <CheckIcon /> : isActive ? <Spinner className="w-6 h-6" /> : <DotIcon />}
            </div>
            <span className={`text-lg ${isActive ? 'text-indigo-400 font-semibold' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                {title}
            </span>
        </div>
    );
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  const steps = [
    { id: 'TRANSCRIBING', title: 'Transcribing English Audio' },
    { id: 'TRANSLATING', title: 'Translating to French' },
    { id: 'SYNTHESIZING', title: 'Synthesizing French Audio' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === status);

  return (
    <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg">
      {steps.map((step, index) => (
        <Step
          key={step.id}
          title={step.title}
          isActive={status !== ConversionStatus.DONE && currentStepIndex === index}
          isCompleted={status === ConversionStatus.DONE || currentStepIndex > index}
        />
      ))}
    </div>
  );
};

export default StatusDisplay;
