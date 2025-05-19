import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function classifyText(message: string): Promise<{
  category: string;
  confidence: number;
  actionableText: string;
}> {
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


            `,
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `categorize this message: ${message}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "category",
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Category of the message",
                enum: [
                  "Love",
                  "Grievance",
                  "Order Information",
                  "Product Information",
                  "Fact",
                  "Business Queries",
                  "Hiring",
                  "Others",
                ],
              },
              confidence: {
                type: "number",
                description:
                  "Confidence score of the category in percentage (0-100)",
              },
              actionableText: {
                type: "string",
                description: "Brief suggestion on how to respond",
              },
            },
            required: ["category", "confidence", "actionableText"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    if (res.output_text) {
      const result = JSON.parse(res.output_text);
      console.log(result);
      return {
        category: result.category,
        confidence: result.confidence,
        actionableText: result.actionableText,
      };
    }

    console.warn("Parsed output was null. Falling back to default values");
    return {
      category: "Others",
      confidence: 0,
      actionableText: "",
    };
  } catch (err) {
    console.error("Classification failed:", err);
    return {
      category: "Others",
      confidence: 0,
      actionableText: "",
    };
  }
}
