import { ref } from 'vue';
import { type Friendship, type TaskDto } from '../types/models';
import taskService from './task.service';
import { friendshipService } from './friendship.service';

/**
 * Service for managing task sharing functionality
 */
class TaskSharingService {
  // State
  private loading = ref(false);
  private friendships = ref<Friendship[]>([]);

  /**
   * Get the loading state
   */
  public getLoading() {
    return this.loading;
  }

  /**
   * Get the friendships list
   */
  public getFriendships() {
    return this.friendships;
  }

  /**
   * Fetch friends for the current user
   * @returns Promise that resolves when friends are fetched
   */
  public async fetchFriends(): Promise<Friendship[]> {
    this.loading.value = true;
    try {
      const friends = await friendshipService.getFriends();
      this.friendships.value = friends;
      return friends;
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      throw error;
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * Share a task with a user
   * @param taskId The ID of the task to share
   * @param username The username of the user to share with
   * @returns Promise with the updated task
   */
  public async shareTask(taskId: string, username: string): Promise<TaskDto> {
    if (!username) {
      return Promise.reject(new Error('Username is required'));
    }

    this.loading.value = true;
    try {
      return await taskService.shareTask(taskId, { username });
    } catch (error) {
      console.error('Failed to share task:', error);
      throw error;
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * Unshare a task with a user
   * @param taskId The ID of the task to unshare
   * @param username The username of the user to unshare with
   * @returns Promise with the updated task
   */
  public async unshareTask(taskId: string, username: string): Promise<TaskDto> {
    if (!username) {
      return Promise.reject(new Error('Username is required'));
    }

    this.loading.value = true;
    try {
      return await taskService.unshareTask(taskId, username);
    } catch (error) {
      console.error('Failed to unshare task:', error);
      throw error;
    } finally {
      this.loading.value = false;
    }
  }
}

// Create a singleton instance of the task sharing service
export const taskSharingService = new TaskSharingService();

export default taskSharingService;