import { apiClient } from '@/api/client';
import { Cycle, CreateCycleRequest } from '@/types/cycle';

export const cyclesApi = {
  async createCycle(data: CreateCycleRequest): Promise<Cycle> {
    const response = await apiClient.axios.post<Cycle>('/cycles', data);
    return response.data;
  },

  async getCycles(): Promise<Cycle[]> {
    const response = await apiClient.axios.get<Cycle[]>('/cycles');
    return response.data;
  },

  async updateCycle(cycleId: string, data: CreateCycleRequest): Promise<Cycle> {
    const response = await apiClient.axios.put<Cycle>(`/cycles/${cycleId}`, data);
    return response.data;
  },

  async deleteCycle(cycleId: string): Promise<void> {
    await apiClient.axios.delete(`/cycles/${cycleId}`);
  },
};
