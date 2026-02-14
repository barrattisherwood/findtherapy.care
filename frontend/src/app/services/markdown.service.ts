import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  constructor(private sanitizer: DomSanitizer) {
    // Configure marked options
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
    });
  }

  /**
   * Convert markdown string to sanitized HTML
   */
  render(markdown: string): SafeHtml {
    if (!markdown) return '';
    
    try {
      const rawHtml = marked.parse(markdown) as string;
      return this.sanitizer.sanitize(1, rawHtml) || '';
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return markdown;
    }
  }

  /**
   * Convert markdown to plain HTML string (for preview)
   */
  renderToString(markdown: string): string {
    if (!markdown) return '';
    
    try {
      return marked.parse(markdown) as string;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return markdown;
    }
  }

  /**
   * Calculate reading time from markdown content
   */
  calculateReadingTime(markdown: string): number {
    if (!markdown) return 0;
    
    // Strip markdown syntax for accurate word count
    const plainText = markdown
      .replace(/[#*_`~\[\]()]/g, '') // Remove markdown characters
      .replace(/\n/g, ' '); // Replace newlines with spaces
    
    const words = plainText.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Generate excerpt from markdown content
   */
  generateExcerpt(markdown: string, maxLength: number = 160): string {
    if (!markdown) return '';
    
    // Strip markdown syntax
    const plainText = markdown
      .replace(/[#*_`~\[\]()]/g, '')
      .replace(/\n/g, ' ')
      .trim();
    
    if (plainText.length <= maxLength) return plainText;
    
    // Cut at last complete word before maxLength
    const trimmed = plainText.substring(0, maxLength);
    const lastSpace = trimmed.lastIndexOf(' ');
    
    return trimmed.substring(0, lastSpace) + '...';
  }
}
