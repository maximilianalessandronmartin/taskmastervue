import apiService from './api.service';
import { 
  type CreateTaskDto,
  type ShareTaskDto,
  type TaskDto,
  type TaskListDto,
  type UpdateTaskDto
} from '../types/models';

export const taskService = {
  /**
   * Get all tasks for the authenticated user
   * @returns Promise with an array of tasks
   */
  getAllTasks(): Promise<TaskDto[]> {
    return apiService.get<TaskDto[]>('/tasks')
      .then(response => response.data);
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
    return apiService.get<TaskDto[]>('/tasks/shared')
      .then(response => response.data);
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
  }
};

export default taskService;
