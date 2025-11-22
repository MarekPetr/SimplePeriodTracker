import { apiClient } from '@/api/client';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/note';

export const noteApi = {
  async getNoteByDate(date: string): Promise<Note | null> {
    try {
      const response = await apiClient.axios.get<Note>(`/notes/${date}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createNote(data: CreateNoteRequest): Promise<Note> {
    const response = await apiClient.axios.post<Note>('/notes', data);
    return response.data;
  },

  async updateNote(date: string, data: UpdateNoteRequest): Promise<Note> {
    const response = await apiClient.axios.put<Note>(`/notes/${date}`, data);
    return response.data;
  },

  async deleteNote(date: string): Promise<void> {
    await apiClient.axios.delete(`/notes/${date}`);
  },
};
