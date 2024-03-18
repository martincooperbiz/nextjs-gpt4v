import anthropic from 'anthropic'; // Import the anthropic library
import { Request, Response } from 'express'; // Assuming you're using Express

// Initialize Anthropics client
const client = new anthropic.Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const runtime = 'edge';

export async function POST(req: Request, res: Response) {
  try {
    const { messages, data } = req.body;

    const initialMessages = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];

    const base64Images: string[] = JSON.parse(data.base64Images);

    const images = base64Images.map((base64Image) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg', // Adjust the media type as necessary
        data: base64Image,
      },
    }));

    const userMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Your task is to closely examine and analyze a medical image provided and generate a detailed and very well-organized analysis and diagnosis. You should build a report that outlines the problems if there are any present and solutions.',
        },
        {
          type: 'text',
          text: `The X-ray shows ${data.bodyPartInXray}. Additional relevant information: ${data.otherRelevantInfo || ''}`,
        },
        ...images,
      ],
    };

    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1012,
      temperature: 0,
      messages: [...initialMessages, userMessage],
    });

    // Assuming you have a function to handle streaming responses
    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
}
