import { describe, it, expect, beforeEach } from 'vitest';
import { TutorSession } from './tutorSession';
import type { LessonItem } from '../types/korean';

const mockLessons: LessonItem[] = [
  { id: '1', type: 'syllable', target: '가', pronunciation: 'ga', translation: null },
  { id: '2', type: 'word', target: '사과', pronunciation: 'sagwa', translation: 'apple' }
];

describe('TutorSession controller', () => {
  let session: TutorSession;

  beforeEach(() => {
    session = new TutorSession(mockLessons);
  });

  it('should initialize with first lesson item', () => {
    expect(session.getCurrentIndex()).toBe(0);
    expect(session.getCurrentItem().target).toBe('가');
    expect(session.getUserInput()).toBe('');
    expect(session.getAccuracy()).toBe(100);
    expect(session.getIsItemCompleted()).toBe(false);
    expect(session.getProgressPercentage()).toBe(50);
  });

  it('should compose Hangul keystrokes during session', () => {
    session.processKey('r');
    expect(session.getUserInput()).toBe('ㄱ');
  });

  it('should calculate accuracy and identify errors', () => {
    session.processKey('s');
    expect(session.getUserInput()).toBe('ㄴ');
    expect(session.getErrors()[0].isError).toBe(true);
    expect(session.getAccuracy()).toBe(0);
  });

  it('should pause on item match and require Enter/Space to advance', () => {
    session.processKey('r');
    const result = session.processKey('k');
    expect(result.isMatch).toBe(true);
    expect(result.isItemCompleted).toBe(true);
    expect(session.getIsItemCompleted()).toBe(true);
    expect(session.getCurrentIndex()).toBe(0);

    const advanceResult = session.processKey('Enter');
    expect(advanceResult.advanced).toBe(true);
    expect(session.getIsItemCompleted()).toBe(false);
    expect(session.getCurrentIndex()).toBe(1);
    expect(session.getCurrentItem().target).toBe('사과');
    expect(session.getUserInput()).toBe('');
  });

  it('should flag tutorial completion on final item advance', () => {
    session.processKey('r');
    session.processKey('k');
    session.processKey('Enter');

    session.processKey('t');
    session.processKey('k');
    session.processKey('r');
    session.processKey('h');
    session.processKey('k');

    expect(session.getIsItemCompleted()).toBe(true);

    const advanceResult = session.processKey(' ');
    expect(advanceResult.isTutorialComplete).toBe(true);
    expect(session.getCurrentIndex()).toBe(0);
  });

  it('should support manual session reset', () => {
    session.processKey('r');
    session.resetSession();
    expect(session.getCurrentIndex()).toBe(0);
    expect(session.getUserInput()).toBe('');
    expect(session.getAccuracy()).toBe(100);
    expect(session.getIsItemCompleted()).toBe(false);
  });
});
