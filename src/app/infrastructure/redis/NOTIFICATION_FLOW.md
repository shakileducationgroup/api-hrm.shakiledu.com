/\*\*

- NOTIFICATION FLOW WITH REDIS PUB/SUB
-
- Complete end-to-end flow for sending real-time notifications
  \*/

// ============================================
// STEP 1: SERVICE LAYER (e.g., leadsService.ts)
// ============================================

import { notificationService } from "../notification/service/notificationService";
import { redisEventPublisher } from "../infrastructure/redis/publisher/redis-event-publisher";

// In your leadsService.ts
async function createLead(leadData, userId) {
// 1. Write to database
const lead = await leadsRepository.create(leadData);

// 2. Create notification AND publish event (all in one)
// This automatically saves to DB and publishes to Redis
await notificationService.createAndPublishNotification({
senderId: userId,
receiverId: lead.assignedTo,
type: "LEAD_CREATED",
title: "New Lead Created",
message: `Lead "${lead.name}" has been created`,
relatedEntityId: lead.id,
metadata: { leadId: lead.id, leadName: lead.name },
});

return lead;
}

// ============================================
// STEP 2: DATABASE SAVE
// ============================================
// notificationService.createAndPublishNotification() saves:
// {
// id: "xxx",
// notificationTitle: "New Lead Created",
// notificationMessage: "Lead name has been created",
// notificationType: "LEAD_CREATED",
// senderId: userId,
// receiverId: assignedUserId,
// relatedEntityId: lead.id,
// metadata: {...},
// isRead: false,
// createdAt: now
// }

// ============================================
// STEP 3: REDIS PUB/SUB PUBLISH
// ============================================
// Event published to Redis channel "notification:created" with payload:
// {
// eventType: "CREATED",
// channel: "notification:created",
// data: {
// id: "xxx",
// recipientId: "assignedUserId",
// title: "New Lead Created",
// message: "Lead name has been created",
// type: "LEAD_CREATED",
// data: {...metadata},
// createdAt: now
// },
// userId: "creatorUserId",
// timestamp: now
// }

// ============================================
// STEP 4: REDIS SUBSCRIBER RECEIVES EVENT
// ============================================
// redisEventSubscriber.on("message") catches the event
// Routes it to handler based on channel: "notification:created"
// Calls: notificationEventHandler(payload)

// ============================================
// STEP 5: HANDLER PROCESSES EVENT
// ============================================
// notificationEventHandler routes to:
// sendNotificationToUser(data, userId)
// ↓
// socketNotificationService.sendNotificationToUser(recipientId, {...})

// ============================================
// STEP 6: SEND TO CONNECTED CLIENT
// ============================================
// socketNotificationService.sendNotificationToUser() does:

const sent = clientManager.broadcastToUser(userId, JSON.stringify({
type: "notification",
data: {
id: "xxx",
type: "LEAD_CREATED",
title: "New Lead Created",
message: "Lead name has been created",
content: {...},
createdAt: new Date(),
}
}));

// If user IS connected:
// → WebSocket message sent ✅
// → Client receives notification in real-time (milliseconds)

// If user NOT connected:
// → Notification already in DB ✅
// → User sees it on next login

// ============================================
// USAGE SUMMARY
// ============================================

/\*\*

- Create notification (saves + publishes to Redis):
  \*/
  await notificationService.createAndPublishNotification({
  senderId: "user1",
  receiverId: "user2",
  type: "LEAD_CREATED",
  title: "Title",
  message: "Message",
  relatedEntityId: "lead123",
  metadata: { custom: "data" },
  });

/\*\*

- Send to specific user (from handler):
  \*/
  socketNotificationService.sendNotificationToUser("userId", {
  type: "LEAD_ASSIGNED",
  title: "Lead Assigned",
  message: "You have a new lead",
  createdBy: "adminId",
  });

/\*\*

- Send to multiple users:
  \*/
  await notificationService.broadcastToUsers(
  ["user1", "user2", "user3"],
  {
  senderId: "adminId",
  type: "ANNOUNCEMENT",
  title: "Important",
  message: "Check this out",
  }
  );

/\*\*

- Send with persistence (saves + sends):
  \*/
  await socketNotificationService.sendAndPersistNotification(
  "senderId",
  "receiverId",
  {
  type: "TASK_COMPLETED",
  title: "Task Done",
  message: "Your task is complete",
  relatedEntityId: "task123",
  }
  );
