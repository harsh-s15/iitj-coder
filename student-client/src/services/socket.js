import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (onMessageReceived) => {
    const socket = new SockJS("http://localhost:8080/ws-coder");
    stompClient = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
            console.log("Connected to WebSocket");
            stompClient.subscribe("/topic/submissions", (message) => {
                if (message.body) {
                    onMessageReceived(JSON.parse(message.body));
                }
            });
        },
        onStompError: (frame) => {
            console.error("Broker reported error: " + frame.headers["message"]);
            console.error("Additional details: " + frame.body);
        },
    });

    stompClient.activate();
};

export const disconnectWebSocket = () => {
    if (stompClient !== null) {
        stompClient.deactivate();
    }
    console.log("Disconnected");
};
