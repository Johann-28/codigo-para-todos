import { Lesson } from "./lesson.interface";

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  isCompleted?: boolean;
  lessons: Lesson[];
  order: number;
}