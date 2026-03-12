"use client";

import { useSession } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRoom, joinRoom } from "@/lib/api";
import { Room } from "@/types/room";
import { BACKEND_URL } from "@/lib/constants";

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useSession();
  const router = useRouter();

  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const room = await createRoom(roomName.trim());
      router.push(`/room/${room.id}`);
    } catch (err) {
      setError("Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    setError("");
    try {
      const room = await joinRoom(inviteCode.trim());
      router.push(`/room/${room.id}`);
    } catch (err) {
      setError("Invalid invite code or room not found.");
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = () => {
    window.location.href = `${BACKEND_URL}/logout`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Dual<span className="text-blue-600">Board</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-9 h-9 rounded-full border border-gray-200"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.displayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Create Room */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create a New Room
            </h2>
            <form onSubmit={handleCreateRoom} className="flex gap-3">
              <input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={creating || !roomName.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Join by Invite Code
            </h2>
            <form onSubmit={handleJoinRoom} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
              <button
                type="submit"
                disabled={joining || !inviteCode.trim()}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? "Joining..." : "Join"}
              </button>
            </form>
          </div>
        </div>

        {/* Rooms List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Rooms
          </h2>
          {rooms.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400 text-lg">No rooms yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Create a room or join one with an invite code
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-gray-900">{room.name}</h3>
                  {room.inviteCode && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Code: {room.inviteCode}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

