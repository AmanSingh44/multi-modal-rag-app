import { conversationService } from "../services/conversationService.js";
import { ragService } from "../services/ragService.js";
import { v4 as uuidv4 } from "uuid";

export const chatController = {
  // POST /api/chat - Send a message and get response
  async chat(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      // Get or create session
      const effectiveSessionId = sessionId || uuidv4();
      const historyManager =
        conversationService.getOrCreateSession(effectiveSessionId);

      // Get AI response
      const { rewrittenQuery, answer, model } =
        await ragService.queryWithHistory(message, historyManager);

      res.json({
        newQuery: rewrittenQuery,
        success: true,
        sessionId: effectiveSessionId,
        message: answer,
        model: model,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID is required",
        });
      }

      const history = conversationService.getSessionHistory(sessionId);

      res.json({
        success: true,
        sessionId,
        history,
        count: history.length,
      });
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};
