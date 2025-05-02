import apiService from './api.service';
import { 
  type CreateTaskDto,
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
   * Mark a task as complete
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
  }
};

export default taskService;