export type AssignmentFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
};

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  semester: number;
  description: string;
  teacherName: string;
  createdAt: string;
  publishedAt?: string;
  dueDate?: string;
  files: AssignmentFile[];
  published: boolean;
};
