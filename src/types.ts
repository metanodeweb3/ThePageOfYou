export interface BookQuote {
  id: string;
  title: string;
  author: string;
  year?: string;
  quote: string;
  context?: string;
}

export interface SongQuote {
  id: string;
  title: string;
  artist: string;
  year?: string;
  lyricsQuote: string;
  albumVibe?: string;
}

export interface MovieQuote {
  id: string;
  title: string;
  character?: string;
  actor?: string;
  year?: string;
  quote: string;
}

export interface GameQuote {
  id: string;
  title: string;
  character?: string;
  developer?: string;
  year?: string;
  quote: string;
}

export interface ArtQuote {
  id: string;
  title: string;
  artist: string;
  year?: string;
  medium?: string;
  quote: string;
}

export interface AcrosticLine {
  letter: string;
  line: string;
}

export interface PersonNameData {
  name: string;
  meaning: string;
  origin?: string;
  adjectives?: string[];
  acrostic?: AcrosticLine[];
  books: BookQuote[];
  songs: SongQuote[];
  movies: MovieQuote[];
  games: GameQuote[];
  art: ArtQuote[];
  source?: 'gemini' | 'fallback' | 'custom';
}

export interface QuizQuestion {
  id: string;
  quote: string;
  options: string[];
  correctIndex: number;
  type: 'book' | 'song' | 'movie';
  workTitle: string;
  creator: string;
}
