import { describe, it, expect } from 'vitest';
import contentData from './index';

describe('Content data validation', () => {
  it('should not contain Latin characters in any target field', () => {
    const latinPattern = /[a-zA-Z]/;
    const violations: { moduleId: string; id: string; target: string }[] = [];

    for (const item of contentData.items) {
      if (latinPattern.test(item.target)) {
        violations.push({
          moduleId: item.moduleId,
          id: item.id,
          target: item.target,
        });
      }
    }

    expect(violations, `Found ${violations.length} target(s) with Latin characters`).toEqual([]);
  });
});
