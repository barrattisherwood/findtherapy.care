import { generateBlogPost } from '../../services/claude.service';

// jest.mock() is hoisted above variable declarations, so we cannot directly
// reference a const here. Instead we declare with let and assign in beforeEach;
// the factory closure captures the variable reference, so by the time
// messages.create is actually called the assignment has happened.
let mockCreate: jest.Mock;

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: (...args: unknown[]) => mockCreate(...args) },
  })),
}));

const validResponse = {
  content: '# Test Post\n\nThis is generated content with enough words to matter.',
  excerpt: 'A short summary.',
  suggestedTags: ['mental-health', 'therapy'],
  socialCaption: 'New post on findtherapy.care!',
};

describe('Claude Service — generateBlogPost', () => {
  beforeEach(() => {
    mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(validResponse) }],
    });
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

    const callArgs = mockCreate.mock.calls[0][0];
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

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('My existing draft content');
  });

  it('does not include draft text when no draft is provided', async () => {
    await generateBlogPost({
      title: 'Test',
      brief: 'A brief',
      authorName: 'Dr. Smith',
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).not.toContain('Polish');
  });

  it('uses the correct Claude model', async () => {
    await generateBlogPost({ title: 'T', brief: 'B', authorName: 'Dr. X' });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-4-6');
  });

  it('throws a SyntaxError if Claude returns invalid JSON', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json at all' }],
    });

    await expect(
      generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' })
    ).rejects.toThrow(SyntaxError);
  });

  it('throws if Claude returns an empty content array', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] });

    await expect(
      generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' })
    ).rejects.toThrow();
  });

  it('propagates API errors from the Anthropic SDK', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Anthropic rate limit exceeded'));

    await expect(
      generateBlogPost({ title: 'Test', brief: 'Brief', authorName: 'Dr. Smith' })
    ).rejects.toThrow('Anthropic rate limit exceeded');
  });
});
