import React, { useState } from 'react';
import type { QuizQuestion } from '../types';

interface InteractiveQuizProps {
  questions: QuizQuestion[];
}

const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return; // Prevent changing answer

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center p-8 bg-gray-800/50 rounded-lg">
        <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
        <p className="text-lg text-gray-300 mt-2">Your Score: {score} out of {questions.length}</p>
        <div className="w-full bg-gray-700 rounded-full h-4 mt-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full text-center text-white text-sm flex items-center justify-center"
            style={{ width: `${percentage}%` }}
          >
            {percentage}%
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="mt-6 bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-800/50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-200">Question {currentQuestionIndex + 1} of {questions.length}</h4>
        <p className="text-md font-medium text-purple-300">Score: {score}</p>
      </div>
      <p className="text-xl text-white mb-6">{currentQuestion.question}</p>
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          let buttonClass = 'w-full text-left p-4 rounded-lg border-2 border-gray-600 hover:bg-gray-700/50 transition-all disabled:cursor-not-allowed';

          if (selectedAnswer) {
            if (option === currentQuestion.correctAnswer) {
                 buttonClass += ' bg-green-500/30 border-green-500'; // Always highlight correct answer
            } else if (isSelected) {
                 buttonClass += ' bg-red-500/30 border-red-500'; // Highlight wrong selection
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={!!selectedAnswer}
              className={buttonClass}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selectedAnswer && (
        <div className="mt-6 animate-fade-in-fast">
          <div className="p-4 bg-gray-900/50 border-l-4 border-purple-400 rounded-r-lg">
            <h5 className="font-bold text-gray-200">Explanation</h5>
            <p className="text-gray-300 mt-1">{currentQuestion.explanation}</p>
          </div>
          <div className="text-right mt-6">
            <button
              onClick={handleNext}
              className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveQuiz;