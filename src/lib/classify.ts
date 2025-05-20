import OpenAI from "openai";
import products from "../data/products.json";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function getProductSummaryFromJson() {
  let summary = "Our products include:\n";
  for (const [category, items] of Object.entries(products)) {
    // Get up to 3 product names per category for brevity
    const names = (items as Record<string, unknown>[])
      .map((item) => item.name as string)
      .filter(Boolean)
      .slice(0, 3);
    summary += `- ${category}: ${names.join(", ")}\n`;
  }
  summary +=
    "\nAll products are made with no added sugar, no artificial sweeteners, no preservatives, and all natural ingredients.";
  return summary;
}

// First Agent: Message Categorization
async function categorizeMessage(message: string): Promise<string> {
  try {
    const res = await openai.responses.create({
      model: "gpt-4o",
      temperature: 0.5,
      input: [
        {
          role: "system",
          content: `
            You are a message classifier. Categorize the user's message into exactly one of the following categories:

            - **Love**: Expressions of affection, praise, or emotional connection to the brand or product indicated.  
            - **Grievance**: Complaints, frustrations, or dissatisfaction indicated.  
            - **Order Information**: Questions about shipping, tracking, invoices, or payment indicated.  
            - **Product Information**: Questions about product features, durability, availability, etc indicated.  
            - **Business Queries**: Partnership or B2B discussions indicated.    
            - **Hiring**: Questions about open roles or applying for jobs indicated.
            - **Others**: Any other text that does not fit into the above categories.
          `,
        },
        {
          role: "user",
          content: `Categorize this message: ${message}`,
        },
      ],
      text: {
        format: {
          name: "category",
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: [
                  "Love",
                  "Grievance",
                  "Order Information",
                  "Product Information",
                  "Business Queries",
                  "Hiring",
                  "Others",
                ],
              },
            },
            required: ["category"],
            additionalProperties: false,
          },
        },
      },
    });

    if (res.output_text) {
      const result = JSON.parse(res.output_text);
      return result.category;
    }
    throw new Error("No output from categorization");
  } catch (err) {
    console.error("Categorization failed:", err);
    return "Others";
  }
}

// Second Agent: Confidence Scoring
async function scoreConfidence(
  message: string,
  category: string
): Promise<number> {
  try {
    const res = await openai.responses.create({
      model: "gpt-4o",
      temperature: 0.3,
      input: [
        {
          role: "system",
          content: `
            You are a confidence scorer. Determine if this message can be handled automatically or needs human intervention.
            Consider these factors:
            1. Can the message be handled with a standard response?
            2. Does it require human judgment or decision-making?
            3. Is it a complex issue that needs escalation?
            4. Does it need clarification or additional information?

            Score ranges:
            - 95-100: Perfect for automation, clear and straightforward
            - 90-94: Very suitable for automation, minor ambiguity
            - 85-89: Suitable for automation with standard response
            - 80-84: Mostly automatable but might need human review
            - 75-79: Borderline case, better with human review
            - 70-74: Likely needs human intervention
            - 65-69: Definitely needs human review
            - 60-64: Complex case requiring human handling

            Guidelines for scoring:
            - Start with a base score of 70
            - Add points for:
              + Clear, straightforward queries
              + Standard information requests
              + Simple order status checks
              + Basic product questions
            - Subtract points for:
              - Complex complaints
              - Multiple issues
              - Unclear requirements
              - Sensitive topics
              - Policy decisions needed
              - Legal concerns
              - Escalation requests
            - Never go below 60 points
          `,
        },
        {
          role: "user",
          content: `Message: ${message}\nCategory: ${category}\nAnalyze if this message can be handled automatically or needs human intervention.`,
        },
      ],
      text: {
        format: {
          name: "confidence",
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              confidence: {
                type: "number",
                description: "Confidence score (60-100)",
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of the score",
              },
            },
            required: ["confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    if (res.output_text) {
      const result = JSON.parse(res.output_text);
      console.log("Confidence score reasoning:", result.reasoning);
      return result.confidence;
    }
    throw new Error("No output from confidence scoring");
  } catch (err) {
    console.error("Confidence scoring failed:", err);
    return 60;
  }
}

// Third Agent: Response Generation and Action Type
async function generateResponse(
  message: string,
  category: string,
  confidence: number
): Promise<{
  response: string;
  action: string;
}> {
  try {
    const res = await openai.responses.create({
      model: "gpt-4o",
      temperature: 0.7,
      input: [
        {
          role: "system",
          content: `
            You are a customer service response generator for The Whole Truth, a health and wellness brand.
            \nOur Business Context:
            - We sell protein bars, supplements, and health products
            - Our products are focused on clean, transparent nutrition
            - We have both B2C and B2B operations
            - We operate in India and have physical stores and online presence
            \nProduct Catalog:\n${getProductSummaryFromJson()}

            Use "Email" as the action type when:
            - Detailed product specifications are requested
            - Formal business communications are needed
            - Documentation or records are required
            - Complex order modifications are needed
            - B2B or partnership discussions
            - Legal or compliance matters
            - Formal complaints that need tracking

            \nUse "DM/Comment" for:
            - Quick responses
            - Public interactions
            - Social media engagement
            - Simple product questions
            - Off-topic messages
            
            \nUse "CRM Ticket" for:
            - Issues requiring tracking
            - Follow-up needed
            - Team collaboration required
            - Complex customer issues

            use product catalog to generate response related to product information
          `,
        },
        {
          role: "user",
          content: `Message: ${message}\nCategory: ${category}\nConfidence: ${confidence}`,
        },
      ],
      text: {
        format: {
          name: "response_action",
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              response: {
                type: "string",
                description: "Professional response message",
              },
              action: {
                type: "string",
                enum: ["Email", "DM/Comment", "CRM Ticket"],
              },
            },
            required: ["response", "action"],
            additionalProperties: false,
          },
        },
      },
    });

    if (res.output_text) {
      return JSON.parse(res.output_text);
    }
    throw new Error("No output from response generation");
  } catch (err) {
    console.error("Response generation failed:", err);
    return {
      response: "Error generating response",
      action: "CRM Ticket",
    };
  }
}

export async function classifyText(message: string): Promise<{
  category: string;
  confidence: number;
  response: string;
  action: string;
}> {
  console.log("Classifying message:", message);
  const category = await categorizeMessage(message);

  const confidence = await scoreConfidence(message, category);

  const { response, action } = await generateResponse(
    message,
    category,
    confidence
  );

  return {
    category,
    confidence,
    response,
    action,
  };
}
