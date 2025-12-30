import { Settings, JobOffer } from '../types';

export const extractCriteriaFromCV = async (file: File, backendUrl: string): Promise<string> => {
  const toBase64 = (f: File) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(f);
  });

  const base64 = await toBase64(file);

  const response = await fetch(`${backendUrl}/api/analyze-cv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_data: base64,
      mime_type: file.type
    })
  });

  const result = await response.json();
  if (result.status === 'error') throw new Error(result.message);
  return result.analysis;
};

export const scoreAndCategorizeJob = async (job: JobOffer, criteria: string, settings: Settings) => {
  const response = await fetch(`${settings.backendUrl}/api/score-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_description: job.description,
      criteria: criteria
    })
  });

  if (!response.ok) throw new Error('Erreur lors du scoring par Gemini 2.5');
  return await response.json();
};
