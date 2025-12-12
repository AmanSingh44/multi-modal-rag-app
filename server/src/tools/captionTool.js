// tool for generating caption
import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const captionGeneratorTool = tool(
  async ({ image_description, caption_style }) => {
    // This tool provides instructions for caption generation
    const styleGuide = {
      concise: "Generate a short, punchy caption (5-10 words)",
      descriptive: "Generate a detailed, descriptive caption (15-25 words)",
      creative: "Generate a creative, engaging caption with personality",
      professional: "Generate a professional, informative caption",
    };

    return `${styleGuide[caption_style] || styleGuide.concise}

Image context: ${image_description}

The caption should be appropriate, engaging, and match the image content.`;
  },
  {
    name: "caption_generator",
    description:
      "Generates image captions based on image description and desired style",
    schema: z.object({
      image_description: z
        .string()
        .describe("Description or analysis of the image content"),
      caption_style: z
        .enum(["concise", "descriptive", "creative", "professional"])
        .describe("Style of caption to generate"),
    }),
  }
);
