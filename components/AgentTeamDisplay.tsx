
import React from 'react';
import type { Agent } from '../types';
import { AgentStatusEnum } from '../types';
import { 
  GlobeIcon,
  BookOpenIcon, 
  FileTextIcon,
  FlaskConicalIcon,
  ImageIcon, 
  CheckSquareIcon, 
  AwardIcon, 
  UserIcon
} from './icons';

interface AgentTeamDisplayProps {
  agents: Agent[];
  progress: number;
}

const agentIcons: Record<string, React.ReactNode> = {
  marketAnalysis: <GlobeIcon className="w-8 h-8" />,
  curriculumDesign: <BookOpenIcon className="w-8 h-8" />,
  contentCreation: <FileTextIcon className="w-8 h-8" />,
  labDevelopment: <FlaskConicalIcon className="w-8 h-8" />,
  multimediaProduction: <ImageIcon className="w-8 h-8" />,
  assessmentDesign: <CheckSquareIcon className="w-8 h-8" />,
  credentialing: <AwardIcon className="w-8 h-8" />,
  tutorPersona: <UserIcon className="w-8 h-8" />,
};


const getStatusStyles = (status: AgentStatusEnum): { container: string; text: string; icon: string } => {
  switch (status) {
    case AgentStatusEnum.IN_PROGRESS:
      return {
        container: 'bg-purple-600/20 border-purple-500 shadow-purple-500/20',
        text: 'text-purple-300',
        icon: 'text-purple-400 animate-pulse'
      };
    case AgentStatusEnum.COMPLETED:
      return {
        container: 'bg-green-600/20 border-green-500',
        text: 'text-green-300',
        icon: 'text-green-400'
      };
    case AgentStatusEnum.ERROR:
      return {
        container: 'bg-red-600/20 border-red-500',
        text: 'text-red-300',
        icon: 'text-red-400'
      };
    case AgentStatusEnum.PENDING:
    default:
      return {
        container: 'bg-gray-800/50 border-gray-700',
        text: 'text-gray-400',
        icon: 'text-gray-500'
      };
  }
};

const AgentTeamDisplay: React.FC<AgentTeamDisplayProps> = ({ agents, progress }) => {
  return (
    <div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 p-6 md:p-8 rounded-2xl shadow-2xl shadow-purple-500/10 animate-fade-in">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-xl md:text-2xl font-bold text-white">Agent Team Status</h3>
           <span className="text-base md:text-lg font-semibold text-purple-300">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {agents.map((agent) => {
          const styles = getStatusStyles(agent.status);
          return (
            <div
              key={agent.id}
              className={`p-4 rounded-lg border flex flex-col items-center text-center transition-all duration-300 ${styles.container}`}
            >
              <div className={`mb-2 ${styles.icon}`}>
                {agentIcons[agent.id] || <UserIcon className="w-8 h-8" />}
              </div>
              <h4 className="font-bold text-sm text-white">{agent.name}</h4>
              <p className={`text-xs ${styles.text} mt-1 h-7`}>
                {agent.subStatus ? <span className="italic">{agent.subStatus}</span> : agent.status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentTeamDisplay;