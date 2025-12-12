// Store conversation histories by session ID
const conversationStore = new Map();

const createConversationManager = (maxHistoryLength = 10) => {
  let history = [];

  return {
    addExchange(question, answer) {
      history.push({ role: "user", content: question });
      history.push({ role: "assistant", content: answer });

      if (history.length > maxHistoryLength * 2) {
        history = history.slice(-maxHistoryLength * 2);
      }
    },

    getFormattedHistory() {
      if (history.length === 0) return "No previous conversation.";
      return history
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");
    },

    getLastNExchanges(n = 8) {
      const recentHistory = history.slice(-n * 2);
      return recentHistory
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");
    },

    getHistory() {
      return history;
    },

    clear() {
      history = [];
    },
  };
};

export const conversationService = {
  getOrCreateSession(sessionId) {
    if (!conversationStore.has(sessionId)) {
      conversationStore.set(sessionId, createConversationManager(10));
    }
    return conversationStore.get(sessionId);
  },

  clearSession(sessionId) {
    if (conversationStore.has(sessionId)) {
      conversationStore.get(sessionId).clear();
      return true;
    }
    return false;
  },

  deleteSession(sessionId) {
    return conversationStore.delete(sessionId);
  },

  getSessionHistory(sessionId) {
    if (conversationStore.has(sessionId)) {
      return conversationStore.get(sessionId).getHistory();
    }
    return [];
  },
};
