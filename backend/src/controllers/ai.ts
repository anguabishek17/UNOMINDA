import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai';

export const suggestSafetyWarnings = async (req: AuthRequest, res: Response) => {
  const { machineName, machineCode } = req.body;

  if (!machineCode) {
    return res.status(400).json({ error: 'machineCode is required.' });
  }

  try {
    const warnings = await aiService.suggestSafetyWarnings(machineName || 'Unknown Machine', machineCode);
    return res.json({ warnings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to suggest warnings.' });
  }
};

export const generateSafetyChecklist = async (req: AuthRequest, res: Response) => {
  const { machineName, title, textContext } = req.body;

  if (!machineName || !title) {
    return res.status(400).json({ error: 'machineName and title are required.' });
  }

  try {
    const checklist = await aiService.generateSafetyChecklist(machineName, title, textContext);
    return res.json({ checklist });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate checklist.' });
  }
};

export const summarizeSOP = async (req: AuthRequest, res: Response) => {
  const { title, textContent } = req.body;

  if (!title || !textContent) {
    return res.status(400).json({ error: 'title and textContent are required.' });
  }

  try {
    const summary = await aiService.summarizeSOP(title, textContent);
    return res.json({ summary });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to summarize SOP.' });
  }
};

export const convertToBulletPoints = async (req: AuthRequest, res: Response) => {
  const { title, textContent } = req.body;

  if (!title || !textContent) {
    return res.status(400).json({ error: 'title and textContent are required.' });
  }

  try {
    const bullets = await aiService.convertToBulletPoints(title, textContent);
    return res.json({ bullets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to convert to bullet points.' });
  }
};
