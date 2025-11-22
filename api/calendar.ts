import { apiClient } from '@/api/client';
import { DayInfo } from '@/types/cycle';

export const calendarApi = {
  async getMonthData(year: number, month: number): Promise<DayInfo[]> {
    const response = await apiClient.axios.get<DayInfo[]>('/calendar/month', {
      params: { year, month },
    });
    return response.data;
  },
};
