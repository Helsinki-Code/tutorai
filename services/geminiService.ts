import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { Certification, CertificationFormInput, Module, TutorPersona, Citation, AutomatedTutorRequest, VideoConceptScene } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const certificationSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The official title of the certification." },
    targetAudience: { type: Type.STRING, description: "A description of the ideal candidate for this certification." },
    totalDurationHours: { type: Type.NUMBER, description: "The total estimated number of hours to complete the certification." },
    overview: { type: Type.STRING, description: "A detailed paragraph summarizing the certification's purpose and scope." },
    prerequisites: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of required skills or knowledge before starting."
    },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          moduleNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          durationHours: { type: Type.NUMBER },
          description: { type: Type.STRING },
          learningOutcomes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                outcome: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['outcome', 'description']
            }
          },
          lab: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              task: { type: Type.STRING },
              deliverable: { type: Type.STRING },
              tutorTip: { type: Type.STRING, description: "A concise, helpful tip for the student regarding this specific lab exercise. The tone should match the selected Tutor Persona." }
            },
            required: ['title', 'task', 'deliverable', 'tutorTip']
          },
          tutorTip: { type: Type.STRING, description: "A concise, helpful tip for the student about the overall module. The tone should match the selected Tutor Persona." }
        },
        required: ['moduleNumber', 'title', 'durationHours', 'description', 'learningOutcomes', 'lab', 'tutorTip']
      }
    },
    sampleQuiz: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING, description: "A brief explanation of why the correct answer is right." }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation']
        }
    },
    capstoneProject: {
        type: Type.OBJECT,
        description: "A final project to assess the student's comprehensive understanding and practical skills.",
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            evaluationCriteria: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of criteria to grade the project." },
            tutorTip: { type: Type.STRING, description: "A final tip for the capstone project. The tone should match the selected Tutor Persona." }
        },
        required: ['title', 'description', 'evaluationCriteria', 'tutorTip']
    },
    introductoryVideoConcept: {
        type: Type.ARRAY,
        description: "A short, scene-by-scene storyboard concept for an introductory video for the certification.",
        items: {
            type: Type.OBJECT,
            properties: {
                scene: { type: Type.STRING, description: "e.g., 'Scene 1: Opening Title'" },
                description: { type: Type.STRING, description: "A description of the visuals and narration for this scene." }
            },
            required: ['scene', 'description']
        }
    }
  },
  required: ['title', 'targetAudience', 'totalDurationHours', 'overview', 'prerequisites', 'modules', 'sampleQuiz', 'capstoneProject', 'introductoryVideoConcept']
};


export const generateCertification = async (input: CertificationFormInput, setAgentSubStatus: (id: string, subStatus: string) => void): Promise<Certification> => {
  // Step 1: Research and generate detailed, grounded content
  const researchPrompt = `
    Act as a world-class AI training and certification architect with deep expertise in the requested topic.
    Your task is to generate an **exceptionally detailed, comprehensive, and lengthy** certification program curriculum based on the user's request.
    Leverage your search capabilities to gather the latest, most relevant, and authoritative information to build the content.
    The final output should be a structured curriculum document in plain text, ready to be converted into a structured format. Do not output JSON yet.

    **Certification Topic:** ${input.topic}
    **Target Audience Level:** ${input.level}
    **Total Desired Length (hours):** ${input.hours}
    **Selected Tutor Persona:** ${input.tutorPersona}
    **Additional Details from User:** ${input.details || "No additional details provided."}

    **Instructions:**
    1.  **Deep Dive:** Research the topic thoroughly. Provide in-depth explanations for all concepts.
    2.  **Structure:** Create a logical flow with an overview, prerequisites, and multiple detailed modules.
    3.  **Module Content:** For each module, write a very detailed description, define specific learning outcomes with descriptions, and design a practical lab exercise.
    4.  **Length and Detail:** Be verbose. The descriptions for the overview and each module should be multiple paragraphs long. The learning outcomes and lab tasks should be specific and clearly explained.
    5.  **Assessments:** Create a relevant sample quiz and a comprehensive Capstone Project.
    6.  **Persona:** While this is the raw content generation phase, keep the **Tutor Persona (${input.tutorPersona})** in mind for the tone of helpful tips.
  `;

  let groundedContent: string;
  let citations: Citation[] = [];

  try {
    setAgentSubStatus('marketAnalysis', 'Researching live web...');
    const researchResponse: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    setAgentSubStatus('marketAnalysis', 'Compiling data...');
    groundedContent = researchResponse.text;
    
    const groundingChunks = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      citations = groundingChunks
        .map((chunk: any) => (chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null))
        .filter((citation: Citation | null): citation is Citation => citation !== null && !!citation.uri && !!citation.title);
    }
    setAgentSubStatus('marketAnalysis', '');
    
  } catch (error) {
    setAgentSubStatus('marketAnalysis', 'Error');
    console.error("Error during content research phase:", error);
    throw new Error("Failed to research and generate grounded content from the AI model.");
  }
  
  // Step 2: Structure the generated content into the required JSON format
  const structuringPrompt = `
    Based on the following detailed curriculum content, your task is to convert it into a valid JSON object that strictly adheres to the provided schema.
    Do not add any new information, summarize, or change the meaning of the content. Your sole purpose is to structure the provided text accurately.
    Ensure all fields from the schema are populated based on the text.
    All "tutorTip" fields must adopt the tone of the selected **Tutor Persona: ${input.tutorPersona}**.

    **Curriculum Content:**
    ---
    ${groundedContent}
    ---
  `;

  try {
    setAgentSubStatus('curriculumDesign', 'Structuring content...');
    const structuringResponse: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: structuringPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: certificationSchema,
      },
    });
    setAgentSubStatus('curriculumDesign', '');

    const jsonText = structuringResponse.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    // Combine the structured JSON with the citations from the first step
    const finalCertification: Certification = {
      ...parsedJson,
      citations: citations,
    };
    
    return finalCertification;

  } catch (error) {
     setAgentSubStatus('curriculumDesign', 'Error');
    console.error("Error during JSON structuring phase:", error);
    throw new Error("Failed to structure the generated content into the required JSON format.");
  }
};


export const generateModuleDiagramImage = async (module: Module): Promise<string> => {
    const prompt = `
    Create a professional, abstract, technical diagram representing the core concepts of a course module.
    
    **Module Title:** "${module.title}"
    **Module Description:** "${module.description}"

    **Design Requirements:**
    - Style: Minimalist, clean, tech-focused infographic.
    - Content: The diagram should visually abstract the key ideas from the module description, not just be a decorative image. Think flowcharts, interconnected nodes, or conceptual graphics.
    - Color Palette: Use a sophisticated and consistent palette of deep blues, purples, teals, and white.
    - Text: Do NOT include any readable text or labels on the image. The diagram should be purely visual.
    - Shape: The overall composition should be balanced and aesthetically pleasing.
    `;

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: '16:9',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                return response.generatedImages[0].image.imageBytes;
            } else {
                throw new Error("No diagram image was generated for this module.");
            }
        } catch (error: any) {
            lastError = error;
            // Check for rate limit error (429) by inspecting the error message
            if (error.message && error.message.includes('429')) {
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                    console.warn(`Rate limit hit for module "${module.title}". Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${maxRetries})`);
                    await sleep(delay);
                }
            } else {
                // Not a retriable error, fail immediately
                console.error(`Non-retriable error generating diagram for module "${module.title}":`, error);
                return ''; // Stop retrying
            }
        }
    }
    
    console.error(`Failed to generate diagram for module "${module.title}" after ${maxRetries} attempts:`, lastError);
    return ''; // Return empty string as a fallback
};


export const generateBadgeImage = async (certificationTitle: string): Promise<string> => {
    const prompt = `
    Create a professional, modern, and visually appealing certification badge design for a program titled: "${certificationTitle}".

    **Design Requirements:**
    - Style: Clean, corporate, tech-focused. Use a sophisticated color palette (e.g., deep blues, silvers, purples, golds).
    - Shape: Circular or a modern shield shape.
    - Elements: Incorporate abstract geometric patterns or circuit board motifs subtly in the background. Include a central icon that abstractly represents the topic. The text should be clear and legible.
    - Text: Must include the certification title, but keep it concise if necessary for the design.
    - Do NOT include any placeholder text like "Company Name" or "Recipient Name".
    - Final Output: The image should feel like a prestigious digital credential.
    `;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating badge image:", error);
        throw new Error("Failed to generate the certification badge.");
    }
};

const dynamicExplanationSchema = {
    type: Type.OBJECT,
    properties: {
        explanationText: { type: Type.STRING, description: "A fresh, detailed explanation of the concept, adhering to the tutor's persona." },
        whiteboardPrompt: { type: Type.STRING, description: "A concise, descriptive prompt for an image generation model to create a monochrome whiteboard diagram that visually represents the explanationText." },
        audioScript: { type: Type.STRING, description: "A conversational, engaging script, based on the explanationText, for a text-to-speech engine. It should sound like a tutor speaking, not just reading text." }
    },
    required: ["explanationText", "whiteboardPrompt", "audioScript"]
};

export const generateDynamicExplanation = async (request: AutomatedTutorRequest, persona: TutorPersona): Promise<{ explanationText: string; whiteboardImages: string[]; audioScript: string; }> => {
    let context = '';
    if (request.type === 'module') {
        const module = request.content as Module;
        context = `Title: "${module.title}". Description: "${module.description}"`;
    } else {
        const scenes = request.content as VideoConceptScene[];
        context = `Title: "Introductory Video Concept". Description: ${scenes.map(s => `${s.scene}: ${s.description}`).join(' ')}`;
    }

    const prompt = `
    You are an AI Tutor with the persona of a "${persona}".
    A student has asked for an explanation of the following learning content:
    **Context:** ${context}

    Your task is to generate a multi-modal response in a single JSON object.
    1.  **explanationText**: Write a fresh, detailed explanation of the core concepts from the provided context. Do NOT just repeat the description. Synthesize and teach. Adhere strictly to your persona.
    2.  **whiteboardPrompt**: Based on your explanation, create a concise prompt for an image generation model. This prompt should describe a simple, monochrome whiteboard-style diagram to visually illustrate your explanation.
    3.  **audioScript**: Based on your explanation, write a natural-sounding, conversational script for a text-to-speech engine. It should feel like you are speaking directly to the student. Start with a friendly greeting.
    `;

    try {
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dynamicExplanationSchema
            }
        });

        const parsedContent = JSON.parse(textResponse.text);
        const { explanationText, whiteboardPrompt, audioScript } = parsedContent;
        
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `
              Create a sequence of 4 simple, clean, monochrome whiteboard-style diagram images that build on each other to illustrate a concept.
              **Style:** Minimalist digital whiteboard. Black line art on a white or very light gray background. Use simple shapes, arrows, and icons.
              **Sequence:** Image 1 should be the initial state. Image 2 adds more detail. Image 3 adds more. Image 4 is the complete diagram. The images must be visually coherent as a sequence.
              **Concept:** ${whiteboardPrompt}
            `,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/png',
                aspectRatio: '16:9',
            },
        });
        
        const whiteboardImages = imageResponse.generatedImages?.map(img => img.image.imageBytes) || [];

        return { explanationText, whiteboardImages, audioScript };

    } catch (error) {
        console.error("Error generating dynamic explanation:", error);
        throw new Error("Failed to generate the tutor's explanation.");
    }
};

export const createTutorChat = (certification: Certification, persona: TutorPersona): Chat => {
    const systemInstruction = `
        You are an expert AI Tutor for the "${certification.title}" certification program. 
        Your purpose is to help learners understand the course material.
        
        **Your assigned persona is: ${persona}.** You must strictly adhere to this personality in all your responses.
        - If the persona is "Encouraging Coach", be positive, supportive, and use motivational language.
        - If the persona is "Formal Professor", be precise, structured, and maintain a formal, academic tone.
        - If the persona is "Witty Expert", be clever, insightful, and use humor or analogies to explain concepts.

        You must only answer questions related to the certification content outlined below. If asked about unrelated topics, politely decline in the style of your persona and steer the conversation back to the course.
        When asked for a visual explanation or diagram, confirm that you can provide one, but the actual image will be generated separately.

        **Certification Overview:**
        ${certification.overview}

        **Modules:**
        ${certification.modules.map(m => `
        - **Module ${m.moduleNumber}: ${m.title}**
          - Description: ${m.description}
          - Key Learning Outcomes: ${m.learningOutcomes.map(o => o.outcome).join(', ')}
        `).join('')}
    `;

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
};