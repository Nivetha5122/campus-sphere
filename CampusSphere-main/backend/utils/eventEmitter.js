// Internal Event Bus - lightweight pub/sub without external tools
// Foundation for notification triggers, audit logging, etc.

const EventEmitter = require("events");
const logger = require("./logger");

class CampusEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    logger.info("EventBus", "CampusSphere Internal Event Bus initialized");
  }

  emit(event, data) {
    logger.debug("EventBus", `Event emitted: ${event}`, { data });
    return super.emit(event, data);
  }

  subscribe(event, handler) {
    this.on(event, handler);
    logger.debug("EventBus", `Subscribed to event: ${event}`);
  }
}

// Singleton instance — shared across the entire app
const eventBus = new CampusEventBus();

// Define event name constants to avoid typos
eventBus.EVENTS = {
  COMPLAINT_CREATED:    "complaint:created",
  COMPLAINT_UPDATED:    "complaint:updated",
  BOOKING_CREATED:      "booking:created",
  BOOKING_CANCELLED:    "booking:cancelled",
  EVENT_CREATED:        "event:created",
  ANNOUNCEMENT_CREATED: "announcement:created",
  USER_REGISTERED:      "user:registered",
  USER_LOGIN:           "user:login",
};

module.exports = eventBus;
