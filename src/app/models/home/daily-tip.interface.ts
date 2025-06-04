export interface DailyTip {
  id: string;
  title: string;
  content: string;
  category: 'programming' | 'learning' | 'motivation' | 'career';
  icon: string;
  date: Date;
}