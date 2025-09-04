import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { MessageCircleIcon, SendIcon, WandIcon, PlayIcon, StopIcon } from './icons';
import { generateDynamicExplanation } from '../services/geminiService';
import type { AutomatedTutorRequest, TutorPersona } from '../types';

interface TutorChatProps {
  chat: Chat | null;
  automatedRequest: AutomatedTutorRequest | null;
  onAutomatedRequestHandled: () => void;
  persona: TutorPersona;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  whiteboardImages?: string[]; // Array for animation frames
  audioScript?: string;
  id: number;
}

const AnimatedWhiteboard: React.FC<{ images: string[], frame: number }> = ({ images, frame }) => {
  if (!images || images.length === 0) return null;
  
  // Ensure the frame index is valid
  const currentFrame = Math.max(0, Math.min(frame, images.length - 1));

  return (
    <div className="p-2 border-t border-gray-600/50">
      <img
        src={`data:image/png;base64,${images[currentFrame]}`}
        alt="Visual Explanation"
        className="rounded-lg border-2 border-gray-500"
      />
    </div>
  );
};

const TutorChat: React.FC<TutorChatProps> = ({ chat, automatedRequest, onAutomatedRequestHandled, persona }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<number | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    setNowPlaying(null);
  }, []);

  const playAudio = useCallback((script: string, messageId: number) => {
    stopAudio();
    const utterance = new SpeechSynthesisUtterance(script);
    const message = messages.find(m => m.id === messageId);
    const totalFrames = message?.whiteboardImages?.length || 1;

    // Reset to first frame on play
    setCurrentFrame(0);

    utterance.onstart = () => {
      setNowPlaying(messageId);
    };

    utterance.onend = () => {
      setNowPlaying(null);
      // Ensure it rests on the final frame after finishing
      setCurrentFrame(totalFrames - 1);
    };
    
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setNowPlaying(null);
    };

    // Synchronize animation with speech progress
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const progress = event.charIndex / script.length;
        const targetFrame = Math.floor(progress * totalFrames);
        setCurrentFrame(targetFrame);
      }
    };
    
    window.speechSynthesis.speak(utterance);
    
  }, [stopAudio, messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // Stop audio when component unmounts or chat changes
    return () => {
      stopAudio();
    };
  }, [chat, stopAudio]);


  useEffect(() => {
    setMessages([{ id: Date.now(), sender: 'ai', text: "Hello! I'm your AI Tutor. Ask me anything about your new certification program, or click the 'Ask Tutor' button on a module for a detailed explanation." }]);
    stopAudio();
  }, [chat, stopAudio]);

  const handleDynamicExplanation = async (request: AutomatedTutorRequest) => {
    if (!chat || isLoading) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: `Please explain "${request.title}"` };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
        const aiMessageId = Date.now() + 1;
        // Add a placeholder message for the AI's response
        setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

        const { explanationText, whiteboardImages, audioScript } = await generateDynamicExplanation(request, persona);

        // Update the placeholder with the full multi-modal content
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: explanationText, whiteboardImages, audioScript } : msg));

    } catch (error) {
        console.error('Error generating dynamic explanation:', error);
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Sorry, I encountered an error while preparing that explanation.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (automatedRequest) {
      handleDynamicExplanation(automatedRequest);
      onAutomatedRequestHandled();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [automatedRequest]);
  
  const handleSendMessage = async (e: React.FormEvent, withVisual: boolean = false) => {
      e.preventDefault();
      if (!input.trim() || !chat || isLoading) return;

      const prompt = input;
      const userMessage: Message = { id: Date.now(), sender: 'user', text: prompt };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
          if (withVisual) {
              // For manual visual requests, we can reuse the dynamic explanation flow
              const request: AutomatedTutorRequest = { type: 'module', content: { description: prompt, title: prompt } as any, title: prompt };
              await handleDynamicExplanation(request);
          } else {
              // Standard text-only chat
              const stream = await chat.sendMessageStream({ message: prompt });
              const aiMessageId = Date.now() + 1;
              setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);
              
              let fullResponse = '';
              for await (const chunk of stream) {
                  fullResponse += chunk.text;
                  setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: fullResponse } : msg));
              }
          }
      } catch (error) {
          console.error('Error sending message:', error);
          setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col h-[600px] animate-fade-in">
      <div className="p-4 border-b border-gray-700 flex items-center">
        <MessageCircleIcon className="w-6 h-6 text-purple-400 mr-3" />
        <h3 className="text-xl font-bold text-white">AI Tutor Chat</h3>
      </div>
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          // When not playing, show the last frame (completed diagram). When playing, show the synced frame.
          const frameToShow = (msg.id === nowPlaying)
            ? currentFrame
            : (msg.whiteboardImages ? msg.whiteboardImages.length - 1 : 0);

          return (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg rounded-xl ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <p className="px-4 py-3" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                {msg.whiteboardImages && msg.whiteboardImages.length > 0 && (
                  <AnimatedWhiteboard images={msg.whiteboardImages} frame={frameToShow} />
                )}
                {msg.audioScript && (
                  <div className="px-4 py-2 border-t border-gray-600/50">
                      <button 
                          onClick={() => nowPlaying === msg.id ? stopAudio() : playAudio(msg.audioScript || '', msg.id)}
                          className="flex items-center text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                      >
                          {nowPlaying === msg.id ? <StopIcon className="w-4 h-4 mr-2" /> : <PlayIcon className="w-4 h-4 mr-2" />}
                          {nowPlaying === msg.id ? 'Stop Narration' : 'Play Audio Explanation'}
                      </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && !messages[messages.length - 1]?.text &&(
            <div className="flex justify-start">
                 <div className="max-w-lg px-4 py-3 rounded-xl bg-gray-700 text-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-900/50 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your tutor a question..."
          disabled={!chat || isLoading}
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
        />
        <button type="button" onClick={(e) => handleSendMessage(e, true)} disabled={!chat || isLoading || !input.trim()} className="ml-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Explain Visually">
          <WandIcon className="w-5 h-5" />
        </button>
        <button type="submit" disabled={!chat || isLoading || !input.trim()} className="ml-2 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Send Message">
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default TutorChat;
