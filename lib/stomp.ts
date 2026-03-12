import { Client, IFrame, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { BACKEND_URL } from "./constants";

export function createStompClient(
  onConnect: (client: Client) => void,
  onDisconnect: () => void,
  onError?: (frame: IFrame) => void
): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      onConnect(client);
    },
    onDisconnect: () => {
      onDisconnect();
    },
    onStompError: (frame) => {
      console.error("STOMP error:", frame);
      onError?.(frame);
    },
    onWebSocketClose: () => {
      onDisconnect();
    },
  });

  return client;
}

export function subscribeToRoom(
  client: Client,
  roomId: string,
  onMessage: (msg: IMessage) => void
) {
  return client.subscribe(`/topic/room/${roomId}`, onMessage);
}

export function subscribeToPreview(
  client: Client,
  roomId: string,
  onMessage: (msg: IMessage) => void
) {
  return client.subscribe(`/topic/room/${roomId}/preview`, onMessage);
}

export function publishStroke(
  client: Client,
  roomId: string,
  body: object
) {
  client.publish({
    destination: `/app/draw/${roomId}`,
    body: JSON.stringify(body),
  });
}

export function publishPreview(
  client: Client,
  roomId: string,
  body: object
) {
  client.publish({
    destination: `/app/draw/${roomId}/preview`,
    body: JSON.stringify(body),
  });
}

