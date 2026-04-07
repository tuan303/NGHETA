export type Category = 'PRIMARY' | 'SECONDARY' | 'HIGH';

export interface Grade {
  id: number;
  name: string;
  title: string;
  audioUrl: string;
  category: Category;
}
