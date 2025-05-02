import { defineStore } from 'pinia';
import taskService from '../services/task.service';
import { type CreateTaskDto, type TaskDto, type UpdateTaskDto } from '../types/models';
import { useAuthStore } from './auth.store';

interface TaskState {
  tasks: TaskDto[];
  currentTask: TaskDto | null;
  loading: boolean;
  error: string | null;
}

export const useTaskStore = defineStore('task', {
  state: (): TaskState => ({
    tasks: [],
    currentTask: null,
    loading: false,
    error: null
  }),

  getters: {
    getTasks: (state) => state.tasks,
    getTaskById: (state) => (id: string) => state.tasks.find(task => task.id === id),
    getCompletedTasks: (state) => state.tasks.filter(task => task.completed),
    getPendingTasks: (state) => state.tasks.filter(task => !task.completed)
  },

  actions: {
    async fetchAllTasks() {
      this.loading = true;
      this.error = null;

      try {
        const tasks = await taskService.getAllTasks();
        this.tasks = tasks;
        return tasks;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch tasks';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTaskById(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const task = await taskService.getTaskById(id);
        this.currentTask = task;
        return task;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch task';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createTask(taskData: CreateTaskDto) {
      this.loading = true;
      this.error = null;

      try {
        const task = await taskService.createTask(taskData);
        this.tasks.push(task);
        return task;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create task';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateTask(id: string, taskData: UpdateTaskDto) {
      this.loading = true;
      this.error = null;

      try {
        const updatedTask = await taskService.updateTask(id, taskData);
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask;
        }
        return updatedTask;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update task';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async completeTask(id: string) {
      this.loading = true;
      this.error = null;

      try {
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
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to complete task';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteTask(id: string) {
      this.loading = true;
      this.error = null;

      try {
        await taskService.deleteTask(id);
        this.tasks = this.tasks.filter(task => task.id !== id);
        if (this.currentTask?.id === id) {
          this.currentTask = null;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete task';
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
