import axios from 'axios';
import { ExtractedResume, ATSFeedback } from '../types';

// Configure Base URL (Change to your production URL when deploying)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add Token to requests
// Add Token to requests
// api.interceptors.request.use((config) => {
//   // Token is sent automatically via Cookies with 'withCredentials: true'
//   return config;
// });

// Auth Services
export const register = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  // Token is handled via HTTP-only cookie now
  return response.data;
};

export const login = async (userData: any) => {
  const response = await api.post('/auth/login', userData);
  // Token is handled via HTTP-only cookie now
  return response.data;
};

export const logout = async () => {
  await api.get('/auth/logout');
  // localStorage.removeItem('token'); // No longer needed
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

export const trackDownload = async () => {
  const response = await api.post('/auth/track-download');
  return response.data;
};

export const upgradeToPremium = async (transactionId: string) => {
  const response = await api.post('/auth/upgrade', { transactionId });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const approvePayment = async (userId: string) => {
  const response = await api.post('/auth/approve', { userId });
  return response.data;
};

export const rejectPayment = async (userId: string) => {
  const response = await api.post('/auth/reject', { userId });
  return response.data;
};

// AI Services (Replacing geminiService.ts)

export async function convertResumeFile(base64Data: string, mimeType: string, jobDescription?: string): Promise<ExtractedResume> {
  const response = await api.post('/ai/convert', { base64Data, mimeType, jobDescription });
  return response.data;
}

export async function createResumeFromText(pastedText: string, jobDescription?: string): Promise<ExtractedResume> {
  const response = await api.post('/ai/text', { pastedText, jobDescription });
  return response.data;
}

export async function improveResumeContent(currentHtml: string, instruction: string, jobDescription?: string): Promise<string> {
  const response = await api.post('/ai/improve', { currentHtml, instruction, jobDescription });
  return response.data.html;
}

export async function reorderResumeSections(currentHtml: string, jobDescription: string): Promise<string> {
  const response = await api.post('/ai/reorder', { currentHtml, jobDescription });
  return response.data.html;
}

export async function getATSFeedback(resumeText: string, jobDescription?: string): Promise<ATSFeedback | null> {
  try {
    const response = await api.post('/ai/feedback', { resumeText, jobDescription });
    return response.data;
  } catch (error) {
    console.error("Feedback Error:", error);
    return null;
  }
}

// Resume CRUD
export const saveResume = async (resumeData: any) => {
  const response = await api.post('/resumes', resumeData);
  return response.data;
};

export const getResumes = async () => {
  const response = await api.get('/resumes');
  return response.data;
};
