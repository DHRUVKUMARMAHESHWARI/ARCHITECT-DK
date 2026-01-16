
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY || "" });

const getResumeStructurePrompt = (jobDescription?: string) => `
    Convert the provided document (Image or PDF) into structured HTML for a resume.
    
    ${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ''}

    CRITICAL STRUCTURAL RULES:
    1. Header: Use this EXACT structure for the contact info:
       <div class="header-grid">
         <div class="header-left">
           <h1>[Candidate Name]</h1>
           <p>[Website URL or Portfolio]</p>
         </div>
         <div class="header-right">
           Email: [Email]<br>
           Mobile: [Phone]
         </div>
       </div>
    2. SECTION SEQUENCING: 
       Analyze the content vs the target JD. 
       - If the JD is highly technical and the candidate is a career-changer, place SKILLS/PROJECTS above EXPERIENCE.
       - If the candidate is a student/recent grad, place EDUCATION above EXPERIENCE.
       - Otherwise, use the standard order: SUMMARY -> EXPERIENCE -> SKILLS -> EDUCATION.
    3. Experience Items: Each job should start with an H3 containing "<span class='job-title'>Title</span> <span class='location'>City, State</span>".
       Follow it with a <div class='role-line'><span>Company Name</span> <span>Dates</span></div>.
    4. Section Headers: Must be in H2 (e.g., EDUCATION, EXPERIENCE, PROJECTS).
    5. Hyperlinks: Detect URLs for projects or social profiles and wrap text in <a href="...">.
    6. Content: Ensure professional, high-impact bullet points.
    7. Clean semantic tags: H1, H2, H3, P, UL, LI, A, STRONG, SPAN.
`;

export async function convertResumeFile(base64Data: string, mimeType: string, jobDescription?: string) {
  const model = "gemini-2.5-flash";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: getResumeStructurePrompt(jobDescription) + " Recreate this resume perfectly with an optimized section order for the target role." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            htmlContent: { type: Type.STRING },
            rawText: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["candidateName", "htmlContent", "rawText"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Conversion Error:", error);
    throw new Error("Failed to process resume file.");
  }
}

export async function createResumeFromText(pastedText: string, jobDescription?: string) {
  const model = "gemini-2.5-flash";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: getResumeStructurePrompt(jobDescription) + ` Transform this raw text into structured resume HTML with the most relevant section first: \n\n ${pastedText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            htmlContent: { type: Type.STRING },
            rawText: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["candidateName", "htmlContent", "rawText"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw new Error("Failed to structure text.");
  }
}

export async function improveResumeContent(currentHtml: string, instruction: string, jobDescription?: string) {
  const model = "gemini-2.5-flash";
  const prompt = `
    Update the following Resume HTML to address: "${instruction}".
    Target JD: ${jobDescription || 'None'}
    Current HTML: ${currentHtml}
    Return ONLY the updated HTML string. Preserve header structure and links.
  `;
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
  } catch (error) {
    throw new Error("Failed to apply improvement.");
  }
}

export async function reorderResumeSections(currentHtml: string, jobDescription: string) {
  const model = "gemini-2.5-flash";
  const prompt = `
    Analyze the following Resume HTML and the Target Job Description.
    Target JD: ${jobDescription}
    Current HTML: ${currentHtml}
    
    TASK: Reorder the H2 sections (EXPERIENCE, EDUCATION, SKILLS, PROJECTS, etc.) to maximize ATS impact for the specific JD.
    - If the role is entry-level, prioritize Education.
    - If the role is highly technical and the candidate has matching skills, prioritize Skills.
    - Otherwise, lead with Experience.
    - Keep all content identical, only move the blocks.
    - Return ONLY the reordered HTML string.
  `;
  try {
    const response = await ai.models.generateContent({ 
      model, 
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text;
  } catch (error) {
    throw new Error("Failed to reorder sections.");
  }
}

export async function getATSFeedback(resumeText: string, jobDescription?: string) {
  const model = "gemini-2.5-flash";
  const prompt = `Analyze resume text for ATS compatibility. Score 0-100. Text: ${resumeText}. JD: ${jobDescription || 'None'}`;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            jdMatchAnalysis: { type: Type.STRING }
          },
          required: ["score", "improvements", "suggestedKeywords", "redFlags", "jdMatchAnalysis"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
}
