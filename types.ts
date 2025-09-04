export enum AudienceLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Expert = "Expert",
}

export enum TutorPersona {
  EncouragingCoach = "Encouraging Coach",
  FormalProfessor = "Formal Professor",
  WittyExpert = "Witty Expert",
}

export interface CertificationFormInput {
  topic: string;
  details: string;
  level: AudienceLevel;
  hours: number;
  tutorPersona: TutorPersona;
}

export interface LearningOutcome {
  outcome: string;
  description: string;
}

export interface LabExercise {
  title: string;
  task: string;
  deliverable: string;
  tutorTip: string;
}

export interface Module {
  moduleNumber: number;
  title: string;
  durationHours: number;
  description: string;
  learningOutcomes: LearningOutcome[];
  lab: LabExercise;
  tutorTip: string;
  diagramImage?: string; // Base64 string for the generated diagram
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string; // Added for enhanced feedback
}

export interface VideoConceptScene {
    scene: string;
    description: string;
}

export type AutomatedTutorRequest = {
    type: 'module' | 'video';
    content: Module | VideoConceptScene[];
    title: string;
}

export interface CapstoneProject {
    title: string;
    description: string;
    evaluationCriteria: string[];
    tutorTip: string;
}

export interface Citation {
  title: string;
  uri: string;
}

export interface Certification {
  title: string;
  targetAudience: string;
  totalDurationHours: number;
  overview: string;
  prerequisites: string[];
  modules: Module[];
  sampleQuiz: QuizQuestion[];
  capstoneProject: CapstoneProject;
  introductoryVideoConcept: VideoConceptScene[];
  citations?: Citation[];
}

export enum AgentStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatusEnum;
  subStatus?: string;
}