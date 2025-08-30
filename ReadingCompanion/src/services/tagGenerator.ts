import axios from 'axios';

export async function generateTags(question: string, answer: string): Promise<string[]> {
  try {
    // Use OpenAI API or another service to generate tags
    const openaiKey = process.env['EXPO_PUBLIC_OPENAI_KEY'];
    
    if (!openaiKey) {
      console.warn('EXPO_PUBLIC_OPENAI_KEY not set, using fallback tags');
      return generateFallbackTags(question, answer);
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates 1-3 concise topic tags for reading notes. Return only the tags as a JSON array of strings, no explanation.'
          },
          {
            role: 'user',
            content: `Generate 1-3 topic tags for this Q&A:\nQ: ${question}\nA: ${answer}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (content) {
      try {
        const tags = JSON.parse(content);
        if (Array.isArray(tags)) {
          return tags.slice(0, 3).map(tag => String(tag).slice(0, 20));
        }
      } catch {
        // If JSON parsing fails, try to extract tags from text
        const matches = content.match(/"([^"]+)"/g);
        if (matches) {
          return matches.map(m => m.replace(/"/g, '')).slice(0, 3);
        }
      }
    }
  } catch (error) {
    console.warn('Tag generation failed:', error);
  }

  return generateFallbackTags(question, answer);
}

function generateFallbackTags(question: string, answer: string): string[] {
  const tags: string[] = [];
  const combinedText = `${question} ${answer}`.toLowerCase();
  
  // Check for common themes
  if (combinedText.includes('character') || combinedText.includes('protagonist')) {
    tags.push('Character');
  }
  if (combinedText.includes('theme') || combinedText.includes('meaning')) {
    tags.push('Themes');
  }
  if (combinedText.includes('plot') || combinedText.includes('story')) {
    tags.push('Plot');
  }
  if (combinedText.includes('setting') || combinedText.includes('place')) {
    tags.push('Setting');
  }
  if (combinedText.includes('style') || combinedText.includes('writing')) {
    tags.push('Writing Style');
  }
  if (combinedText.includes('emotion') || combinedText.includes('feel')) {
    tags.push('Emotions');
  }
  if (combinedText.includes('lesson') || combinedText.includes('learn')) {
    tags.push('Lessons');
  }
  if (combinedText.includes('symbol') || combinedText.includes('metaphor')) {
    tags.push('Symbolism');
  }
  
  // If no specific tags found, add a general one
  if (tags.length === 0) {
    tags.push('Reflection');
  }
  
  return tags.slice(0, 3);
}