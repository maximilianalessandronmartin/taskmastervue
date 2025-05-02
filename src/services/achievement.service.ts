import apiService from './api.service';
import { type Achievement, type AchievementDto } from '../types/models';

export const achievementService = {
  /**
   * Get all achievements for the authenticated user
   * @returns Promise with an array of achievements
   */
  getAllAchievements(): Promise<Achievement[]> {
    return apiService.get<Achievement[]>('/achievements')
      .then(response => response.data);
  },

  /**
   * Get an achievement by ID
   * @param id Achievement ID
   * @returns Promise with the achievement
   */
  getAchievementById(id: number): Promise<Achievement> {
    return apiService.get<Achievement>(`/achievements/${id}`)
      .then(response => response.data);
  },

  /**
   * Search for an achievement by name
   * @param name Achievement name
   * @returns Promise with the achievement
   */
  searchAchievement(name: string): Promise<Achievement> {
    return apiService.get<Achievement>(`/achievements/search?name=${name}`)
      .then(response => response.data);
  },

  /**
   * Add a new achievement
   * @param achievementData Achievement data
   * @returns Promise with the added achievement
   */
  addAchievement(achievementData: AchievementDto): Promise<Achievement> {
    return apiService.put<Achievement>('/achievements/add', achievementData)
      .then(response => response.data);
  },

  /**
   * Update an achievement
   * @param id Achievement ID
   * @param achievementData Updated achievement data
   * @returns Promise with void
   */
  updateAchievement(id: number, achievementData: AchievementDto): Promise<void> {
    return apiService.post<void>(`/achievements/update/${id}`, achievementData)
      .then(() => {});
  },

  /**
   * Delete an achievement
   * @param id Achievement ID
   * @returns Promise with void
   */
  deleteAchievement(id: number): Promise<void> {
    return apiService.delete<void>(`/achievements/delete?id=${id}`)
      .then(() => {});
  }
};

export default achievementService;