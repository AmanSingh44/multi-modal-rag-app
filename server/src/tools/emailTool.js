// tool for generating email
import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const emailBuilderTool = tool(
  async ({
    sender_role,
    receiver_role,
    email_purpose,
    email_tone,
    additional_context,
  }) => {
    // This tool structures the email generation request
    const context = additional_context
      ? `\nAdditional context: ${additional_context}`
      : "";

    return `Generate a ${email_tone} email with the following details:
- From: ${sender_role}
- To: ${receiver_role}
- Purpose: ${email_purpose}${context}

Format the email with these sections:
SUBJECT: [concise subject line]
GREETING: [appropriate greeting]
BODY: [well-structured email body with paragraphs]
CLOSING: [professional closing with signature]`;
  },
  {
    name: "email_builder",
    description:
      "Structures and generates professional emails based on sender role, receiver role, purpose, tone, and additional context",
    schema: z.object({
      sender_role: z.string().describe("Role or title of the email sender"),
      receiver_role: z.string().describe("Role or title of the email receiver"),
      email_purpose: z
        .string()
        .describe("Main purpose or objective of the email"),
      email_tone: z
        .enum(["professional", "casual", "formal", "friendly"])
        .describe("Desired tone of the email"),
      additional_context: z
        .string()
        .optional()
        .describe("Any additional context or specific requirements"),
    }),
  }
);
