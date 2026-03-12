import { BACKEND_URL } from "./constants";
import { User } from "@/types/user";
import { Room } from "@/types/room";
import { Stroke } from "@/types/drawing";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// Auth
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>("/api/v1/auth/me");
  } catch {
    return null;
  }
}

// Rooms
export async function createRoom(name: string): Promise<Room> {
  return apiFetch<Room>("/api/v1/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function joinRoom(inviteCode: string): Promise<Room> {
  return apiFetch<Room>(`/api/v1/rooms/join/${inviteCode}`, {
    method: "POST",
  });
}

// History
export async function fetchRoomHistory(roomId: string): Promise<Stroke[]> {
  return apiFetch<Stroke[]>(`/api/v1/rooms/${roomId}/history`);
}

