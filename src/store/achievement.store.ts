import { defineStore } from 'pinia';
import achievementService from '../services/achievement.service';
import { type Achievement, type AchievementDto } from '../types/models';

interface AchievementState {
  achievements: Achievement[];
  currentAchievement: Achievement | null;
  loading: boolean;
  error: string | null;
}

export const useAchievementStore = defineStore('achievement', {
  state: (): AchievementState => ({
    achievements: [],
    currentAchievement: null,
    loading: false,
    error: null
  }),
  
  getters: {
    getAchievements: (state) => state.achievements,
    getAchievementById: (state) => (id: number) => 
      state.achievements.find(achievement => achievement.id === id),
    getUnlockedAchievements: (state) => (userXp: number) => 
      state.achievements.filter(achievement => achievement.xpRequired <= userXp)
  },
  
  actions: {
    async fetchAllAchievements() {
      this.loading = true;
      this.error = null;
      
      try {
        const achievements = await achievementService.getAllAchievements();
        this.achievements = achievements;
        return achievements;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch achievements';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchAchievementById(id: number) {
      this.loading = true;
      this.error = null;
      
      try {
        const achievement = await achievementService.getAchievementById(id);
        this.currentAchievement = achievement;
        return achievement;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch achievement';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async searchAchievement(name: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const achievement = await achievementService.searchAchievement(name);
        return achievement;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to search achievement';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async addAchievement(achievementData: AchievementDto) {
      this.loading = true;
      this.error = null;
      
      try {
        const achievement = await achievementService.addAchievement(achievementData);
        this.achievements.push(achievement);
        return achievement;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to add achievement';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updateAchievement(id: number, achievementData: AchievementDto) {
      this.loading = true;
      this.error = null;
      
      try {
        await achievementService.updateAchievement(id, achievementData);
        // Fetch the updated achievement to update the local state
        await this.fetchAchievementById(id);
        // Update the achievement in the list
        const index = this.achievements.findIndex(achievement => achievement.id === id);
        if (index !== -1 && this.currentAchievement) {
          this.achievements[index] = this.currentAchievement;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update achievement';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async deleteAchievement(id: number) {
      this.loading = true;
      this.error = null;
      
      try {
        await achievementService.deleteAchievement(id);
        this.achievements = this.achievements.filter(achievement => achievement.id !== id);
        if (this.currentAchievement?.id === id) {
          this.currentAchievement = null;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete achievement';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    clearError() {
      this.error = null;
    }
  }
});