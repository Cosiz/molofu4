export type Role = 'commander' | 'helper' | 'observer';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_help';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  dueTime: string;
  dueDate: string;
  location: string;
  contact: string;
  status: TaskStatus;
  completedAt: string;
  notes: TaskNote[];
  createdAt: string;
  createdBy: string;
  gps_lat?: number;
  gps_lng?: number;
}

export interface TaskNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Family {
  id: string;
  name: string;
  members: User[];
}
