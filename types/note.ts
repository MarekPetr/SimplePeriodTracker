export interface EmojiNote {
  emoji: string
  description: string
}

export interface Note {
  id: string;
  user_id: string;
  date: string;
  text: string | null;
  emoji_notes: EmojiNote[];
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  date: string;
  text?: string;
  emoji_notes?: EmojiNote[];
}

export interface UpdateNoteRequest {
  text?: string;
  emoji_notes?: EmojiNote[];
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
