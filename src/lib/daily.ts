const DAILY_API_KEY = process.env.DAILY_API_KEY || "";
const DAILY_API_URL = "https://api.daily.co/v1";

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
    nbf?: number;
    max_participants?: number;
  };
}

interface CreateRoomOptions {
  name?: string;
  expiryMinutes?: number;
  maxParticipants?: number;
}

export async function createRoom(options: CreateRoomOptions = {}): Promise<DailyRoom> {
  const { name, expiryMinutes = 60, maxParticipants = 2 } = options;

  const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name,
      properties: {
        exp,
        max_participants: maxParticipants,
        enable_chat: true,
        enable_screenshare: true,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Daily API error: ${error.error || response.statusText}`);
  }

  return response.json();
}

export async function getRoom(roomName: string): Promise<DailyRoom | null> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Daily API error: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteRoom(roomName: string): Promise<void> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Daily API error: ${response.statusText}`);
  }
}

interface MeetingToken {
  token: string;
}

interface CreateTokenOptions {
  roomName: string;
  userName?: string;
  isOwner?: boolean;
  expiryMinutes?: number;
}

export async function createMeetingToken(options: CreateTokenOptions): Promise<string> {
  const { roomName, userName, isOwner = false, expiryMinutes = 60 } = options;

  const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;

  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        exp,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Daily API error: ${response.statusText}`);
  }

  const data: MeetingToken = await response.json();
  return data.token;
}
