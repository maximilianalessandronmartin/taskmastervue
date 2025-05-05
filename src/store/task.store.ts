import { defineStore } from 'pinia';
import taskService from '../services/task.service';
import { type CreateTaskDto, type ShareTaskDto, type TaskDto, type UpdateTaskDto } from '../types/models';
import { useAuthStore } from './auth.store';

interface TaskState {
  tasks: TaskDto[];
  sharedTasks: TaskDto[];
  currentTask: TaskDto | null;
  loading: boolean;
  error: string | null;
}

// Helper function to handle API calls with loading and error states
async function handleApiCall<T>(
  storeInstance: any,
  apiCall: () => Promise<T>
): Promise<T> {
  storeInstance.loading = true;
  storeInstance.error = null;

  try {
    const result = await apiCall();
    return result;
  } catch (error: any) {
    storeInstance.error = error.response?.data?.message || 'An error occurred';
    throw error;
  } finally {
    storeInstance.loading = false;
  }
}

export const useTaskStore = defineStore('task', {
  state: (): TaskState => ({
    tasks: [],
    sharedTasks: [],
    currentTask: null,
    loading: false,
    error: null
  }),

  getters: {
    getTasks: (state) => state.tasks,
    getSharedTasks: (state) => state.sharedTasks,
    getTaskById: (state) => (id: string) => state.tasks.find(task => task.id === id) || state.sharedTasks.find(task => task.id === id),
    getCompletedTasks: (state) => state.tasks.filter(task => task.completed),
    getPendingTasks: (state) => state.tasks.filter(task => !task.completed),
    // This getter is redundant with getTasks, but keeping for backward compatibility
    getAllTasks: (state) => [...state.tasks]
  },

  actions: {
    async fetchAllTasks(type?: string) {
      return handleApiCall(this, async () => {
        const tasks = await taskService.getAllTasks(type);
        this.tasks = tasks;
        return tasks;
      });
    },

    async fetchOwnedTasks() {
      return this.fetchAllTasks('owned');
    },

    async fetchTaskById(id: string) {
      return handleApiCall(this, async () => {
        const task = await taskService.getTaskById(id);
        this.currentTask = task;
        return task;
      });
    },

    async createTask(taskData: CreateTaskDto) {
      return handleApiCall(this, async () => {
        const task = await taskService.createTask(taskData);
        this.tasks.push(task);
        return task;
      });
    },

    async updateTask(id: string, taskData: UpdateTaskDto) {
      return handleApiCall(this, async () => {
        const updatedTask = await taskService.updateTask(id, taskData);
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask;
        }
        return updatedTask;
      });
    },

    async completeTask(id: string) {
      return handleApiCall(this, async () => {
        const updatedTask = await taskService.completeTask(id);
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask;
        }

        // Update user data to reflect newly gained XP
        const authStore = useAuthStore();
        await authStore.fetchUser();

        return updatedTask;
      });
    },

    async deleteTask(id: string) {
      return handleApiCall(this, async () => {
        await taskService.deleteTask(id);
        this.tasks = this.tasks.filter(task => task.id !== id);
        if (this.currentTask?.id === id) {
          this.currentTask = null;
        }
      });
    },

    clearError() {
      this.error = null;
    },

    async fetchSharedTasks() {
      return handleApiCall(this, async () => {
        const tasks = await taskService.getSharedTasks();
        this.sharedTasks = tasks;
        return tasks;
      });
    },

    async shareTask(id: string, username: string) {
      return handleApiCall(this, async () => {
        const shareData: ShareTaskDto = { username };
        const updatedTask = await taskService.shareTask(id, shareData);
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask;
        }
        return updatedTask;
      });
    },

    async unshareTask(id: string, username: string) {
      return handleApiCall(this, async () => {
        const updatedTask = await taskService.unshareTask(id, username);
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask;
        }
        return updatedTask;
      });
    }
  }
});
