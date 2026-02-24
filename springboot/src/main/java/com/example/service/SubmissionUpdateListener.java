package com.example.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;

@Service
public class SubmissionUpdateListener implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    public SubmissionUpdateListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String body = new String(message.getBody());
        System.out.println("SubmissionUpdateListener: Received message from Redis: " + body);
        // Message body is expected to be: {"submissionId": 123, "status": "ACCEPTED"}
        // Push to WebSocket topic
        messagingTemplate.convertAndSend("/topic/submissions", body);
        System.out.println("SubmissionUpdateListener: Forwarded to WebSocket /topic/submissions");
    }
}
