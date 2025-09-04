import React, { useState } from 'react';
import type { CertificationFormInput } from '../types';
import { AudienceLevel, TutorPersona } from '../types';

interface CertificationFormProps {
  onSubmit: (data: CertificationFormInput) => void;
  isLoading: boolean;
}

const CertificationForm: React.FC<CertificationFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('AI Governance & Compliance for Enterprises');
  const [details, setDetails] = useState('Focus on the EU AI Act, NIST AI RMF, and ISO 42001. Include practical labs on implementing compliance controls in a cloud environment.');
  const [level, setLevel] = useState<AudienceLevel>(AudienceLevel.Intermediate);
  const [hours, setHours] = useState(20);
  const [tutorPersona, setTutorPersona] = useState<TutorPersona>(TutorPersona.EncouragingCoach);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ topic, details, level, hours, tutorPersona });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
            Certification Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            disabled={isLoading}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            placeholder="e.g., Advanced React Performance"
          />
        </div>
        <div>
          <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-2">
            Optional Details
          </label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            disabled={isLoading}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            placeholder="e.g., Focus on memoization, code splitting, and server components..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-2">
              Audience Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as AudienceLevel)}
              disabled={isLoading}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              {Object.values(AudienceLevel).map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
           <div className="md:col-span-1">
            <label htmlFor="tutorPersona" className="block text-sm font-medium text-gray-300 mb-2">
              Tutor Persona
            </label>
            <select
              id="tutorPersona"
              value={tutorPersona}
              onChange={(e) => setTutorPersona(e.target.value as TutorPersona)}
              disabled={isLoading}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              {Object.values(TutorPersona).map((persona) => (
                <option key={persona} value={persona}>{persona}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor="hours" className="block text-sm font-medium text-gray-300 mb-2">
              Total Hours ({hours}h)
            </label>
            <input
              type="range"
              id="hours"
              min="1"
              max="100"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              disabled={isLoading}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-6"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Building Certification...
            </>
          ) : (
            'Launch Agent Team'
          )}
        </button>
      </form>
    </div>
  );
};

export default CertificationForm;
