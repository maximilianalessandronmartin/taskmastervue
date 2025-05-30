import apiService from './api.service';
import { 
  type CreateTaskDto,
  type ShareTaskDto,
  type TaskDto,
  type TaskListDto,
  type TimerUpdateDto,
  type UpdateTaskDto
} from '../types/models';

export const taskService = {
  /**
   * Get tasks for the authenticated user with optional type filter
   * @param type Optional filter: 'all', 'owned', or 'shared'
   * @returns Promise with an array of tasks
   */
  getAllTasks(type?: string): Promise<TaskDto[]> {
    const url = type ? `/tasks?type=${type}` : '/tasks';
    return apiService.get<TaskDto[]>(url)
      .then(response => response.data);
  },

  /**
   * Get owned tasks for the authenticated user
   * @returns Promise with an array of owned tasks
   */
  getOwnedTasks(): Promise<TaskDto[]> {
    return this.getAllTasks('owned');
  },

  /**
   * Get a task by ID
   * @param id Task ID
   * @returns Promise with the task
   */
  getTaskById(id: string): Promise<TaskDto> {
    return apiService.get<TaskDto>(`/tasks/${id}`)
      .then(response => response.data);
  },

  /**
   * Search for tasks by name with pagination
   * @param query Search query
   * @param page Page number
   * @param size Page size
   * @returns Promise with paginated task list
   */
  searchTasks(query: string = '', page: number = 0, size: number = 10): Promise<TaskListDto> {
    return apiService.get<TaskListDto>(`/tasks/search?query=${query}&page=${page}&size=${size}`)
      .then(response => response.data);
  },

  /**
   * Create a new task
   * @param taskData Task data
   * @returns Promise with the created task
   */
  createTask(taskData: CreateTaskDto): Promise<TaskDto> {
    return apiService.put<TaskDto>('/tasks/create', taskData)
      .then(response => response.data);
  },

  /**
   * Update a task
   * @param id Task ID
   * @param taskData Updated task data
   * @returns Promise with the updated task
   */
  updateTask(id: string, taskData: UpdateTaskDto): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/update/${id}`, taskData)
      .then(response => response.data);
  },

  /**
   * Toggle a task's completion status
   * @param id Task ID
   * @returns Promise with the updated task
   */
  completeTask(id: string): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/complete/${id}`)
      .then(response => response.data);
  },

  /**
   * Delete a task
   * @param id Task ID
   * @returns Promise with void
   */
  deleteTask(id: string): Promise<void> {
    return apiService.delete<void>(`/tasks/delete/${id}`)
      .then(() => {});
  },

  /**
   * Get shared tasks
   * @returns Promise with an array of shared tasks
   */
  getSharedTasks(): Promise<TaskDto[]> {
    return this.getAllTasks('shared');
  },

  /**
   * Share a task with a user
   * @param id Task ID
   * @param shareData Share data containing username
   * @returns Promise with the updated task
   */
  shareTask(id: string, shareData: ShareTaskDto): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/${id}/share`, shareData)
      .then(response => response.data);
  },

  /**
   * Unshare a task with a user
   * @param id Task ID
   * @param username Username to unshare with
   * @returns Promise with the updated task
   */
  unshareTask(id: string, username: string): Promise<TaskDto> {
    return apiService.delete<TaskDto>(`/tasks/${id}/share/${username}`)
      .then(response => response.data);
  },

  /**
   * Update the timer for a task
   * @param id Task ID
   * @param timerData Timer update data
   * @returns Promise with the updated task
   */
  updateTimer(id: string, timerData: TimerUpdateDto): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/${id}/timer/update`, timerData)
      .then(response => response.data);
  },

  /**
   * Start the timer for a task
   * @param id Task ID
   * @returns Promise with the updated task
   */
  startTimer(id: string): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/${id}/timer/start`)
      .then(response => response.data);
  },

  /**
   * Pause the timer for a task
   * @param id Task ID
   * @returns Promise with the updated task
   */
  pauseTimer(id: string): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/${id}/timer/pause`)
      .then(response => response.data);
  },

  /**
   * Reset the timer for a task
   * @param id Task ID
   * @returns Promise with the updated task
   */
  resetTimer(id: string): Promise<TaskDto> {
    return apiService.post<TaskDto>(`/tasks/${id}/timer/reset`)
      .then(response => response.data);
  }
};

export default taskService;
