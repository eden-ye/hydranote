import { Page } from '@playwright/test';

// Known BlockSuite internal errors that are not application bugs
const IGNORED_ERROR_PATTERNS = [
  'Cannot convert slice snapshot to slice', // BlockSuite drag/drop internal
  'ZodError', // BlockSuite schema validation during clipboard operations
];

export class ConsoleMonitor {
  private errors: string[] = [];

  constructor(page: Page) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known BlockSuite internal errors
        const isIgnored = IGNORED_ERROR_PATTERNS.some((pattern) => text.includes(pattern));
        if (!isIgnored) {
          this.errors.push(text);
        }
      }
    });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): string[] {
    return this.errors;
  }

  clear(): void {
    this.errors = [];
  }
}
