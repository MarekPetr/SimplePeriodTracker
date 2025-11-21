export interface Note {
  id: string;
  user_id: string;
  date: string;
  content: string;
  emojis?: string[]; // Array of emoji characters
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  date: string;
  content: string;
  emojis?: string[];
}

export interface UpdateNoteRequest {
  content?: string;
  emojis?: string[];
}

// Common predefined emojis for quick access
export const QUICK_ACCESS_EMOJIS: string[] = [
  '😊', // Happy
  '😢', // Sad
  '😴', // Tired
  '🤕', // Cramps
  '🤢', // Nausea
  '😰', // Anxious
  '💪', // Energetic
  '🍕', // Cravings
  '🩸', // Heavy flow
  '💧', // Light flow
  '💊', // Medication
  '🛌', // Rest
];
