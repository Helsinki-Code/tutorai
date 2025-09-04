import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Chat } from '@google/genai';
import CertificationForm from './components/CertificationForm';
import AgentTeamDisplay from './components/AgentTeamDisplay';
import GeneratedCertification from './components/GeneratedCertification';
import TutorChat from './components/TutorChat';
import { generateCertification, generateBadgeImage, createTutorChat, generateModuleDiagramImage } from './services/geminiService';
import type { Agent, Certification, CertificationFormInput, AutomatedTutorRequest } from './types';
import { AgentStatusEnum, TutorPersona } from './types';

const INITIAL_AGENTS: Agent[] = [
  { id: 'marketAnalysis', name: 'Market Analyst', description: 'Analyzes demand & audience.', status: AgentStatusEnum.PENDING },
  { id: 'curriculumDesign', name: 'Curriculum Architect', description: 'Designs course structure.', status: AgentStatusEnum.PENDING },
  { id: 'contentCreation', name: 'Content Creator', description: 'Writes lesson materials.', status: AgentStatusEnum.PENDING },
  { id: 'labDevelopment', name: 'Lab Developer', description: 'Builds practical exercises.', status: AgentStatusEnum.PENDING },
  { id: 'assessmentDesign', name: 'Assessment Designer', description: 'Creates quizzes & exams.', status: AgentStatusEnum.PENDING },
  { id: 'multimediaProduction', name: 'Multimedia Producer', description: 'Generates diagrams & assets.', status: AgentStatusEnum.PENDING },
  { id: 'credentialing', name: 'Credentialing Agent', description: 'Designs the final badge.', status: AgentStatusEnum.PENDING },
  { id: 'tutorPersona', name: 'AI Tutor', description: 'Initializes the tutor persona.', status: AgentStatusEnum.PENDING },
];


const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [certification, setCertification] = useState<Certification | null>(null);
  const [badgeImage, setBadgeImage] = useState<string>('');
  const [tutorChat, setTutorChat] = useState<Chat | null>(null);
  const [tutorPersona, setTutorPersona] = useState<TutorPersona>(TutorPersona.EncouragingCoach);
  const [automatedTutorRequest, setAutomatedTutorRequest] = useState<AutomatedTutorRequest | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (certification && badgeImage) {
      try {
        const dataToStore = {
          certification,
          badgeImage,
          tutorPersona,
        };
        sessionStorage.setItem('generatedCertificationData', JSON.stringify(dataToStore));
      } catch (e) {
        console.error("Failed to save certification to session storage", e);
      }
    }
  }, [certification, badgeImage, tutorPersona]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'true') {
      setIsEmbedded(true);
      document.documentElement.classList.add('embed-mode');
      document.body.classList.add('embed-mode');

      if (!certification) { 
        try {
          const storedDataJSON = sessionStorage.getItem('generatedCertificationData');
          if (storedDataJSON) {
            const storedData = JSON.parse(storedDataJSON);
            setCertification(storedData.certification);
            setBadgeImage(storedData.badgeImage);
            setTutorPersona(storedData.tutorPersona);
            const chatInstance = createTutorChat(storedData.certification, storedData.tutorPersona);
            setTutorChat(chatInstance);
            setAgents(prev => prev.map(a => ({...a, status: AgentStatusEnum.COMPLETED})));
          }
        } catch (e) {
          console.error("Failed to load certification from session storage", e);
          setError("Could not load embedded certification content.");
        }
      }
    }
  }, [certification]);


  const progress = useMemo(() => {
    if (!agents.length) return 0;
    const completedAgents = agents.filter(agent => agent.status === AgentStatusEnum.COMPLETED).length;
    return (completedAgents / agents.length) * 100;
  }, [agents]);

  const updateAgentStatus = (id: string, status: AgentStatusEnum, subStatus: string = '') => {
    setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, status, subStatus } : agent));
  };
  
  const updateMultipleAgentStatuses = (ids: string[], status: AgentStatusEnum) => {
    setAgents(prev => prev.map(agent => ids.includes(agent.id) ? { ...agent, status, subStatus: '' } : agent));
  }
  
  const handleAskTutor = useCallback((request: AutomatedTutorRequest) => {
    setAutomatedTutorRequest(request);
    const chatElement = document.getElementById('tutor-chat-section');
    chatElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const resetState = () => {
    setCertification(null);
    setBadgeImage('');
    setTutorChat(null);
    setAgents(INITIAL_AGENTS);
    setError(null);
    setAutomatedTutorRequest(null);
    sessionStorage.removeItem('generatedCertificationData');
  }

  const handleFormSubmit = useCallback(async (data: CertificationFormInput) => {
    resetState();
    setIsLoading(true);
    setTutorPersona(data.tutorPersona);
    
    const curriculumAgents = ['marketAnalysis', 'curriculumDesign', 'contentCreation', 'labDevelopment', 'assessmentDesign'];

    try {
      updateAgentStatus('marketAnalysis', AgentStatusEnum.IN_PROGRESS);
      updateAgentStatus('curriculumDesign', AgentStatusEnum.IN_PROGRESS);
      
      const setAgentSubStatus = (id: string, subStatus: string) => {
         setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, subStatus } : agent));
      }

      const generatedCert = await generateCertification(data, setAgentSubStatus);
      setCertification(generatedCert);
      updateMultipleAgentStatuses(curriculumAgents, AgentStatusEnum.COMPLETED);
      
      updateAgentStatus('multimediaProduction', AgentStatusEnum.IN_PROGRESS);
      updateAgentStatus('credentialing', AgentStatusEnum.IN_PROGRESS);

      const badgePromise = generateBadgeImage(generatedCert.title);
      
      const diagramImages: string[] = [];
      for (const module of generatedCert.modules) {
        const diagramImage = await generateModuleDiagramImage(module);
        diagramImages.push(diagramImage);
      }

      const generatedBadge = await badgePromise;

      setBadgeImage(generatedBadge);
      updateAgentStatus('credentialing', AgentStatusEnum.COMPLETED);

      const certWithDiagrams: Certification = {
        ...generatedCert,
        modules: generatedCert.modules.map((module, index) => ({
            ...module,
            diagramImage: diagramImages[index]
        }))
      };
      setCertification(certWithDiagrams);
      updateAgentStatus('multimediaProduction', AgentStatusEnum.COMPLETED);

      updateAgentStatus('tutorPersona', AgentStatusEnum.IN_PROGRESS);
      const chatInstance = createTutorChat(certWithDiagrams, data.tutorPersona);
      setTutorChat(chatInstance);
      updateAgentStatus('tutorPersona', AgentStatusEnum.COMPLETED);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        setAgents(prev => prev.map(agent => (agent.status === AgentStatusEnum.IN_PROGRESS ? { ...agent, status: AgentStatusEnum.ERROR } : agent)));
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const certificationContent = certification && (
    <>
      <GeneratedCertification 
        certification={certification} 
        badgeImage={badgeImage} 
        onAskTutor={handleAskTutor}
        isEmbedded={isEmbedded}
      />
      <div id="tutor-chat-section">
        {!isLoading && tutorChat && <TutorChat chat={tutorChat} persona={tutorPersona} automatedRequest={automatedTutorRequest} onAutomatedRequestHandled={() => setAutomatedTutorRequest(null)} />}
      </div>
    </>
  );

  if (isEmbedded) {
    return (
       <main className="max-w-7xl mx-auto relative z-10 p-4 sm:p-6 lg:p-8">
        {!certification && !error && (
          <div className="flex items-center justify-center h-screen">
            <p className="text-gray-400 text-lg text-center">Certification content not found.<br/>Please generate a certification first on the main page.</p>
          </div>
        )}
         {error && (
            <div className="mt-8 bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg text-center">
                <h3 className="font-bold">An Error Occurred</h3>
                <p>{error}</p>
            </div>
        )}
        {certificationContent}
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30"></div>
      
      <main className="max-w-7xl mx-auto relative z-10">
        <header className="text-center my-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            Virtual AI Tutor &amp; Certification Builder
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
            Define a topic, and our agentic AI team will autonomously research, design, and build a complete, enterprise-ready certification program for you.
          </p>
        </header>

        {!certification && (
          <CertificationForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        )}
        
        {isLoading && !certification && <div className="h-8" />}

        {(isLoading || certification) && (
          <AgentTeamDisplay agents={agents} progress={progress} />
        )}

        {error && (
            <div className="mt-8 bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg text-center">
                <h3 className="font-bold">An Error Occurred</h3>
                <p>{error}</p>
            </div>
        )}

        {certification && (
          <>
            {certificationContent}
            <div className="text-center mt-12">
              <button
                onClick={resetState}
                className="bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg"
              >
                Create Another Certification
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="text-center py-8 mt-12 text-gray-500 relative z-10">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;