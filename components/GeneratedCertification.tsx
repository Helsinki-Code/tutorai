import React, { useState, useRef } from 'react';
import type { Certification, Module, Citation, AutomatedTutorRequest } from '../types';
import { LightbulbIcon, DownloadIcon, ChalkboardUserIcon, CodeIcon } from './icons';
import InteractiveQuiz from './InteractiveQuiz';
import EmbedCodeDisplay from './EmbedCodeDisplay';

// @ts-ignore
const { jsPDF } = window.jspdf;

const TutorTooltip: React.FC<{ tip: string }> = ({ tip }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative inline-block ml-2">
            <button
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onClick={() => setVisible(!visible)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
                aria-label="Show tutor tip"
            >
                <LightbulbIcon className="w-5 h-5" />
            </button>
            {visible && (
                <div className="absolute bottom-full mb-2 w-64 bg-gray-900 border border-purple-500/50 text-white text-sm rounded-lg p-3 shadow-lg z-10 right-0 transform translate-x-1/2 md:right-auto md:translate-x-0">
                    <p className="font-semibold mb-1">Tutor Tip:</p>
                    <p className="text-gray-300">{tip}</p>
                </div>
            )}
        </div>
    );
};


const ModuleAccordion: React.FC<{ module: Module; onAskTutor: (request: AutomatedTutorRequest) => void; }> = ({ module, onAskTutor }) => {
    const [isOpen, setIsOpen] = useState(module.moduleNumber === 1);
    
    return (
        <div className="border border-gray-700/50 rounded-lg mb-4 overflow-hidden bg-gray-800/30 transition-all duration-300 break-inside-avoid">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
                <div className="text-left">
                    <span className="font-bold text-lg text-purple-300">Module {module.moduleNumber}: {module.title}</span>
                    <span className="text-sm text-gray-400 block mt-1">{module.durationHours} hours</span>
                </div>
                <div className="flex items-center">
                     <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent accordion from toggling
                            onAskTutor({ type: 'module', content: module, title: module.title });
                        }}
                        className="mr-3 p-1 rounded-full text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        aria-label="Ask tutor to explain this module"
                        title="Ask tutor to explain"
                    >
                       <ChalkboardUserIcon className="w-6 h-6" />
                    </button>
                    <TutorTooltip tip={module.tutorTip} />
                    <svg className={`w-6 h-6 transform transition-transform duration-300 text-gray-400 ml-4 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {isOpen && (
                <div className="p-6 bg-gray-900/30 space-y-6 animate-fade-in-fast">
                    {module.diagramImage && (
                        <div className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
                           <img src={`data:image/png;base64,${module.diagramImage}`} alt={`Diagram for ${module.title}`} className="w-full h-auto object-cover" />
                        </div>
                    )}
                    <p className="text-gray-300 whitespace-pre-wrap">{module.description}</p>
                    <div>
                        <h4 className="font-semibold text-gray-200 text-md">Learning Outcomes:</h4>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                            {module.learningOutcomes.map((outcome, i) => <li key={i}><strong className="text-gray-300">{outcome.outcome}:</strong> {outcome.description}</li>)}
                        </ul>
                    </div>
                    <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-200 text-md">Lab: {module.lab.title}</h4>
                            <TutorTooltip tip={module.lab.tutorTip} />
                        </div>
                        <p className="mt-2 text-gray-400"><strong className="text-gray-300">Task:</strong> {module.lab.task}</p>
                        <p className="mt-1 text-gray-400"><strong className="text-gray-300">Deliverable:</strong> {module.lab.deliverable}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const CitationsDisplay: React.FC<{ citations: Citation[] }> = ({ citations }) => {
    if (!citations || citations.length === 0) return null;
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
            <h3 className="text-2xl font-bold mb-4 text-white">Sources &amp; Citations</h3>
            <div className="columns-1 md:columns-2 gap-x-8">
                {citations.map((citation, index) => (
                    <div key={index} className="mb-3 break-inside-avoid">
                        <a 
                            href={citation.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-sm"
                        >
                            {citation.title || new URL(citation.uri).hostname}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};


const GeneratedCertification: React.FC<{ certification: Certification; badgeImage: string; onAskTutor: (request: AutomatedTutorRequest) => void; isEmbedded: boolean; }> = ({ certification, badgeImage, onAskTutor, isEmbedded }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
    
    const handleDownloadPDF = async () => {
        const content = printRef.current;
        if (!content) return;

        setIsDownloading(true);
        try {
            // @ts-ignore
            const canvas = await html2canvas(content, { 
                scale: 2,
                backgroundColor: '#111827',
                 onclone: (document) => {
                    const actionBtns = document.getElementById('action-buttons');
                    if(actionBtns) actionBtns.style.visibility = 'hidden';
                }
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${certification.title.replace(/ /g, '_')}_Certification.pdf`);

        } catch(error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <div className="mt-8 animate-fade-in">
            {!isEmbedded && (
                <div id="action-buttons" className="text-center mb-8 flex items-center justify-center space-x-4">
                     <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 transform hover:-translate-y-0.5"
                    >
                        {isDownloading ? (
                            <>
                               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                               </svg>
                               Downloading...
                            </>
                        ) : (
                            <>
                               <DownloadIcon className="w-5 h-5 mr-2" />
                               Download as PDF
                            </>
                        )}
                    </button>
                     <button
                        onClick={() => setIsEmbedModalOpen(true)}
                        className="inline-flex items-center bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-all shadow-lg transform hover:-translate-y-0.5"
                    >
                       <CodeIcon className="w-5 h-5 mr-2" />
                       Embed
                    </button>
                </div>
            )}
            
            <div ref={printRef} className="space-y-8">
                <header className="text-center bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10 break-after-page">
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{certification.title}</h2>
                    <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">{certification.overview}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10 space-y-4">
                         <h3 className="text-2xl font-bold mb-4 text-white">Program Details</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
                            <p><strong>Target Audience:</strong> {certification.targetAudience}</p>
                            <p><strong>Total Duration:</strong> {certification.totalDurationHours} hours</p>
                            <p className="sm:col-span-2"><strong>Prerequisites:</strong> {certification.prerequisites.join(', ')}</p>
                         </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
                        <h3 className="text-2xl font-bold mb-4 text-white">Your Credential</h3>
                        {badgeImage ? (
                            <img src={`data:image/png;base64,${badgeImage}`} alt="Generated Certification Badge" className="w-48 h-48 rounded-full object-cover shadow-2xl shadow-purple-500/30 transition-transform duration-300 hover:scale-105" />
                        ) : (
                            <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center animate-pulse">
                                <p className="text-gray-400 text-sm">Generating badge...</p>
                            </div>
                        )}
                    </div>
                </div>

                {certification.citations && <CitationsDisplay citations={certification.citations} />}

                <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
                     <h3 className="text-2xl font-bold mb-6 text-white">Curriculum &amp; Labs</h3>
                     {certification.modules.map(module => 
                        <ModuleAccordion 
                            key={module.moduleNumber} 
                            module={module}
                            onAskTutor={onAskTutor}
                         />
                     )}
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10 break-before-page">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white">Capstone Project: {certification.capstoneProject.title}</h3>
                        <TutorTooltip tip={certification.capstoneProject.tutorTip} />
                    </div>
                     <p className="text-gray-300 mb-4">{certification.capstoneProject.description}</p>
                     <h4 className="font-semibold text-gray-200 text-md">Evaluation Criteria:</h4>
                     <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                        {certification.capstoneProject.evaluationCriteria.map((criterion, i) => <li key={i}>{criterion}</li>)}
                     </ul>
                </div>

                 <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
                     <h3 className="text-2xl font-bold mb-6 text-white">Knowledge Check</h3>
                     <InteractiveQuiz questions={certification.sampleQuiz} />
                </div>


                 <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-white">Introductory Video Concept</h3>
                        <button
                            onClick={() => onAskTutor({ type: 'video', content: certification.introductoryVideoConcept, title: "Introductory Video Concept"})}
                            className="flex items-center gap-2 px-3 py-1 text-sm rounded-full text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors"
                            aria-label="Ask tutor to explain this video concept"
                            title="Ask tutor to explain"
                        >
                           <ChalkboardUserIcon className="w-4 h-4" />
                           Ask Tutor
                        </button>
                    </div>
                     <div className="space-y-4">
                        {certification.introductoryVideoConcept.map((scene, index) => (
                            <div key={index} className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                                <p className="font-semibold text-purple-300">{scene.scene}</p>
                                <p className="text-gray-300 mt-1">{scene.description}</p>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
             {isEmbedModalOpen && <EmbedCodeDisplay onClose={() => setIsEmbedModalOpen(false)} />}
        </div>
    );
};

export default GeneratedCertification;