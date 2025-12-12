// services/agentService.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  createToolCallingAgent,
  AgentExecutor,
} from "@langchain/classic/agents";
import { HumanMessage } from "@langchain/core/messages";
import { emailBuilderTool } from "../tools/emailTool.js";
import { captionGeneratorTool } from "../tools/captionTool.js";
import { csvAnalysisTool } from "../tools/csvTool.js";
import { GoogleAICacheManager } from "@google/generative-ai/server";

// Initialize model
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.LLM_MODEL_NAME,
  temperature: 0.3,
});

// Tools configuration
const tools = {
  email: [emailBuilderTool],
  caption: [captionGeneratorTool],
  csv: [csvAnalysisTool],
  all: [emailBuilderTool, captionGeneratorTool, csvAnalysisTool],
};

// Helper function to create prompt template
const createPromptTemplate = (systemMessage) => {
  return ChatPromptTemplate.fromMessages([
    ["system", systemMessage],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);
};

// Helper function to create agent
const createAgent = async (toolsList, systemMessage) => {
  const prompt = createPromptTemplate(systemMessage);

  const agent = await createToolCallingAgent({
    llm: model,
    tools: toolsList,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools: toolsList,
  });
};

// Parse email output
const parseEmailOutput = (result) => {
  let content = "";

  if (typeof result.output === "string") {
    content = result.output;
  } else if (Array.isArray(result.output)) {
    content = result.output
      .map((item) => item.text || item.content || item)
      .filter((item) => typeof item === "string")
      .join("\n");
  } else if (result.content) {
    content =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);
  } else {
    content = JSON.stringify(result);
  }

  const subjectMatch = content.match(
    /SUBJECT:\s*(.+?)(?=\nGREETING:|\n\n|$)/is
  );
  const greetingMatch = content.match(/GREETING:\s*(.+?)(?=\nBODY:|\n\n|$)/is);
  const bodyMatch = content.match(
    /BODY:\s*([\s\S]+?)(?=\nCLOSING:|\n\nCLOSING:|$)/is
  );
  const closingMatch = content.match(/CLOSING:\s*([\s\S]+?)$/is);

  const email = {
    subject: subjectMatch ? subjectMatch[1].trim() : "Generated Email",
    greeting: greetingMatch ? greetingMatch[1].trim() : "Dear Recipient,",
    body: bodyMatch ? bodyMatch[1].trim() : content,
    closing: closingMatch ? closingMatch[1].trim() : "Best regards,",
  };

  return {
    email,
    full_email: `${email.subject}\n\n${email.greeting}\n\n${email.body}\n\n${email.closing}`,
    raw_content: content,
  };
};

// Parse CSV output
const parseCSVOutput = (result, originalData) => {
  let content = "";

  if (typeof result.output === "string") {
    content = result.output;
  } else if (Array.isArray(result.output)) {
    content = result.output
      .map((item) => item.text || item.content || item)
      .filter((item) => typeof item === "string")
      .join("\n");
  } else if (result.content) {
    content =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);
  } else {
    content = JSON.stringify(result);
  }

  return {
    analysis: content,
    raw_content: content,
    data_summary: {
      total_rows: originalData.length,
      columns: originalData.length > 0 ? Object.keys(originalData[0]) : [],
    },
  };
};

// Execute Email Agent
export const executeEmailAgent = async (params) => {
  const {
    sender_role,
    receiver_role,
    email_purpose,
    email_tone = "professional",
    additional_context = "",
  } = params;

  const systemMessage = `You are a professional email writing assistant. You have access to an email builder tool.

When generating emails, always format your response like this:
SUBJECT: [subject line]
GREETING: [greeting]
BODY: [email body - can be multiple paragraphs]
CLOSING: [closing and signature]

Make the email clear, professional, and appropriate for the given context.`;

  const agentExecutor = await createAgent(tools.email, systemMessage);

  const input = `Write a ${email_tone} email from a ${sender_role} to a ${receiver_role}.

Purpose: ${email_purpose}
${additional_context ? `Additional context: ${additional_context}` : ""}

Please use the email_builder tool and generate a complete professional email.`;

  const result = await agentExecutor.invoke({ input });
  return parseEmailOutput(result);
};

// Execute Caption Agent
export const executeCaptionAgent = async (params) => {
  const { imageContent, mimeType, caption_style = "concise" } = params;

  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: `Generate a ${caption_style} caption for this image. The caption should be appropriate, engaging, and match the image content.`,
      },
      {
        type: "image_url",
        image_url: `data:${mimeType};base64,${imageContent}`,
      },
    ],
  });

  const llmResponse = await model.invoke([message]);

  return {
    caption: llmResponse.content,
    raw_content: llmResponse.content,
  };
};

//csv analysis portion

// Execute CSV Agent
export const executeCSVAgent = async (params) => {
  // const cacheManager = new GoogleAICacheManager(process.env.GOOGLE_API_KEY);

  const { csvData, question } = params;

  const systemMessage = `You are an expert data analyst. You have access to CSV data analysis tools.

When analyzing CSV data:
1. Examine the structure and columns of the data
2. Use the csv_analyzer tool to structure your analysis approach
3. Provide clear, actionable insights with specific numbers and patterns
4. Always cite the data when making claims
5. Calculate statistics accurately from the provided dataset

The CSV data has been parsed and is available for analysis.`;

  /* const cachedAnalysis = await cacheManager.create({
    model: model,
    systemMessage: systemMessage,
    contents: [
      {
        role: "user",
        parts: {
          csv: tools.csv,
        },
      },
    ],
    ttlSeconds: 1000,
  });
*/
  const agentExecutor = await createAgent(tools.csv, systemMessage);

  const columnNames = csvData.length > 0 ? Object.keys(csvData[0]) : [];
  const rowCount = csvData.length;

  const input = `Analyze this CSV data:

Data Overview:
- Total rows: ${rowCount}
- Columns: ${columnNames.join(", ")}

Full dataset: ${JSON.stringify(csvData, null, 2)}

Question: ${question}

Please use the csv_analyzer tool and provide comprehensive insights with accurate calculations.`;

  //agentExecutor.useCachedContent(cachedAnalysis)

  const result = await agentExecutor.invoke({ input });
  return parseCSVOutput(result, csvData);
};
