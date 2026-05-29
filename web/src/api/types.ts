export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration_seconds: number;
  mime_type: string;
  has_cover: boolean;
  uploaded_by?: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface PlaylistTrack extends Track {
  position: number;
}

export interface PlaylistDetail {
  playlist: Playlist;
  tracks: PlaylistTrack[];
}
