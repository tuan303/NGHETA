export type Category = 'PRIMARY' | 'SECONDARY' | 'HIGH';

export interface AudioItem {
  id: string;
  title: string;
  url: string;
}

export interface Grade {
  id: number;
  name: string;
  title: string; // Kept for backward compatibility
  audioUrl: string; // Kept for backward compatibility
  category: Category;
  audios: AudioItem[];
}
