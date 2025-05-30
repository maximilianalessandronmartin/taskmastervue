// User related interfaces
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  xp: number;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  accountNonExpired: boolean;
}

export interface UserDto {
  id: string;
  createdAt: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  xp: number;
  notificationsEnabled?: boolean;
}

export interface RegisterUserDto {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RefreshRequestDto {
  token: string;
}

export interface LogoutRequestDto {
  token: string;
}

// Task related interfaces
export interface TaskDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  dueDate: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  completed: boolean;
  visibility?: 'PRIVATE' | 'SHARED';
  sharedWith?: UserDto[];
  owner?: boolean;
  pomodoroTimeMillis?: number;
  remainingTimeMillis?: number;
  lastTimerUpdateTimestamp?: string;
  timerActive?: boolean;
}

export interface CreateTaskDto {
  name: string;
  description?: string;
  dueDate?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface UpdateTaskDto {
  name?: string;
  description?: string;
  dueDate?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  completed?: boolean;
}

export interface ShareTaskDto {
  username: string;
}

export interface TimerUpdateDto {
  remainingTimeMillis: number;
  timerActive: boolean;
}

export interface TaskListDto {
  tasks: TaskDto[];
  pages: number;
  count: number;
}

// Achievement related interfaces
export interface Achievement {
  id: number;
  name: string;
  description: string;
  xpRequired: number;
}

export interface AchievementDto {
  name: string;
  description: string;
  xpRequired: number;
}

// Friendship related interfaces
export interface Friendship {
  id: string;
  user: User;
  friend: User;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
}

// Notification related interfaces
export interface NotificationDto {
  id: string;
  recipient: UserDto;
  type: 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'ACHIEVEMENT_UNLOCKED' | 'TASK_SHARED' | 'TASK_COMPLETED';
  message: string;
  payload: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipient: User;
  type: 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'ACHIEVEMENT_UNLOCKED' | 'TASK_SHARED' | 'TASK_COMPLETED';
  message: string;
  payload: string;
  read: boolean;
  createdAt: string;
}

// Error related interfaces
export interface ErrorMessage {
  statusCode: number;
  timestamp: string;
  message: string;
  description: string;
}
