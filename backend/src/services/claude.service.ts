import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratePostOptions {
  title: string;
  brief: string;
  authorName: string;
  draft?: string;
}

export interface GeneratedPost {
  content: string;
  excerpt: string;
  suggestedTags: string[];
  socialCaption: string;
}

const SYSTEM_PROMPT = `You are a professional content writer for findtherapy.care, \
a South African mental health practitioner directory. You write warm, professional, \
evidence-informed blog posts on behalf of registered practitioners.

Tone: approachable, trustworthy, not clinical. Written for a general SA audience \
seeking mental health support. Never sensationalist, never prescriptive. \
Always include a gentle call to action pointing readers toward finding a therapist.

Respond ONLY with a valid JSON object. No markdown fences, no preamble.`;

export const generateBlogPost = async (options: GeneratePostOptions): Promise<GeneratedPost> => {
  const { title, brief, authorName, draft } = options;

  const userPrompt = draft
    ? `Polish and improve this draft blog post by ${authorName}.
Title: "${title}"
Brief/intent: "${brief}"

Existing draft:
${draft}

Return JSON with: { "content": "full markdown post", "excerpt": "2-3 sentence summary", "suggestedTags": ["tag1","tag2"], "socialCaption": "caption for social media max 200 chars" }`
    : `Write a blog post for ${authorName}, a mental health practitioner on findtherapy.care.
Title: "${title}"
Brief: "${brief}"

Return JSON with: { "content": "full markdown post min 600 words", "excerpt": "2-3 sentence summary", "suggestedTags": ["tag1","tag2"], "socialCaption": "caption for social media max 200 chars" }`;

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const response = await stream.finalMessage();

  const raw = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Strip markdown code fences if the model wraps the JSON
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  return JSON.parse(text) as GeneratedPost;
};
