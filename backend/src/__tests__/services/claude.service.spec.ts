import { generateBlogPost } from '../../services/claude.service';

let mockStream: jest.Mock;

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { stream: (...args: unknown[]) => mockStream(...args) },
  })),
}));

const validResponse = {
  content: '# Test Post\n\nThis is generated content with enough words to matter.',
  excerpt: 'A short summary.',
  suggestedTags: ['mental-health', 'therapy'],
  socialCaption: 'New post on findtherapy.care!',
};

const makeFinalMessage = (text: string) => ({
  finalMessage: jest.fn().mockResolvedValue({
    content: [{ type: 'text', text }],
  }),
});

describe('Claude Service — generateBlogPost', () => {
  beforeEach(() => {
    mockStream = jest.fn().mockReturnValue(makeFinalMessage(JSON.stringify(validResponse)));
  });

  it('returns generated content from a brief', async () => {
    const result = await generateBlogPost({
      title: 'Burnout or Just Tired?',
      brief: 'Explain the difference between burnout and tiredness',
      authorName: 'Dr. Julia Smith',
    });

    expect(result.content).toContain('Test Post');
    expect(result.excerpt).toBe('A short summary.');
    expect(result.suggestedTags).toContain('mental-health');
    expect(result.socialCaption).toBe('New post on findtherapy.care!');
  });

  it('passes title and brief to the API', async () => {
    await generateBlogPost({
      title: 'Managing Anxiety at Work',
      brief: 'Tips for professionals',
      authorName: 'Dr. Smith',
    });

    const callArgs = mockStream.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('Managing Anxiety at Work');
    expect(callArgs.messages[0].content).toContain('Tips for professionals');
  });

  it('uses the polish prompt when a draft is provided', async () => {
    await generateBlogPost({
      title: 'Test',
      brief: 'A brief',
      authorName: 'Dr. Smith',
      draft: 'My existing draft content',
    });

    const callArgs = mockStream.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('My existing draft content');
  });

  it('does not include draft text when no draft is provided', async () => {
    await generateBlogPost({
      title: 'Test',
      brief: 'A brief',
      authorName: 'Dr. Smith',
    });

    const callArgs = mockStream.mock.calls[0][0];
    expect(callArgs.messages[0].content).not.toContain('Polish');
  });

  it('uses the correct Claude model', async () => {
    await generateBlogPost({ title: 'T', brief: 'B', authorName: 'Dr. X' });
    const callArgs = mockStream.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001');
  });

  it('strips markdown code fences before parsing JSON', async () => {
    mockStream.mockReturnValueOnce(
      makeFinalMessage('```json\n' + JSON.stringify(validResponse) + '\n```')
    );

    const result = await generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' });
    expect(result.excerpt).toBe('A short summary.');
  });

  it('throws a SyntaxError if Claude returns invalid JSON', async () => {
    mockStream.mockReturnValueOnce(makeFinalMessage('not json at all'));

    await expect(
      generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' })
    ).rejects.toThrow(SyntaxError);
  });

  it('throws if Claude returns an empty content array', async () => {
    mockStream.mockReturnValueOnce({
      finalMessage: jest.fn().mockResolvedValue({ content: [] }),
    });

    await expect(
      generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' })
    ).rejects.toThrow();
  });

  it('propagates API errors from the Anthropic SDK', async () => {
    mockStream.mockReturnValueOnce({
      finalMessage: jest.fn().mockRejectedValueOnce(new Error('Anthropic rate limit exceeded')),
    });

    await expect(
      generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' })
    ).rejects.toThrow('Anthropic rate limit exceeded');
  });
});
