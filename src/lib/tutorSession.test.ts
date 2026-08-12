import { describe, it, expect, beforeEach } from 'vitest';
import { TutorSession } from './tutorSession';
import type { CurriculumData } from './tutorSession';

const mockCurriculum: CurriculumData = {
  modules: [
    { id: 'all', title: 'All Lessons', description: 'Comprehensive practice' },
    { id: 'l1', title: 'Level 1 — Basic Syllables', description: 'Syllable exercises' },
    { id: 'l3', title: 'Level 3 — Everyday Vocabulary', description: 'Vocabulary exercises' },
  ],
  items: [
    {
      id: 'l1-1',
      moduleId: 'l1',
      target: '가',
      pronunciation: 'ga',
      translation: null,
    },
    {
      id: 'l3-1',
      moduleId: 'l3',
      target: '사과',
      pronunciation: 'sagwa',
      translation: 'apple',
    },
  ],
};

describe('TutorSession controller', () => {
  let session: TutorSession;

  beforeEach(() => {
    session = new TutorSession(mockCurriculum, 'all', false);
  });

  it('should initialize cleanly from CurriculumData JSON format', () => {
    expect(session.getModules().length).toBe(3);
    expect(session.getModules()[1].title).toBe('Level 1 — Basic Syllables');
    expect(session.getCurrentIndex()).toBe(0);
    expect(session.getCurrentItem().target).toBe('가');
    expect(session.getUserInput()).toBe('');
    expect(session.getAccuracy()).toBe(100);
    expect(session.getIsItemCompleted()).toBe(false);
    expect(session.getProgressPercentage()).toBe(50);
  });

  it('should format combined Romanization and translation display text', () => {
    expect(session.getDisplayText(mockCurriculum.items[0])).toBe('ga');
    expect(session.getDisplayText(mockCurriculum.items[1])).toBe('sagwa · apple');
  });

  it('should filter items by selected level module', () => {
    session.setFilter('l3', false);
    expect(session.getFilter()).toBe('l3');
    expect(session.getTotalItems()).toBe(1);
    expect(session.getCurrentItem().target).toBe('사과');

    session.setFilter('l1', false);
    expect(session.getTotalItems()).toBe(1);
    expect(session.getCurrentItem().target).toBe('가');

    session.setFilter('all', false);
    expect(session.getTotalItems()).toBe(2);
  });

  it('should handle empty module filter array gracefully with empty item placeholder', () => {
    session.setFilter([], false);
    expect(session.getTotalItems()).toBe(0);
    expect(session.getCurrentItem().target).toBe('');
    expect(session.getCurrentItem().id).toBe('empty');
  });

  it('should not trigger item completion when no modules are selected and backspace or keys are pressed (Issue #2)', () => {
    session.setFilter([], false);
    const resBack = session.processKey('Backspace');
    expect(resBack.isMatch).toBe(false);
    expect(resBack.isItemCompleted).toBe(false);
    expect(session.getIsItemCompleted()).toBe(false);

    const resKey = session.processKey('r');
    expect(resKey.isMatch).toBe(false);
    expect(resKey.isItemCompleted).toBe(false);
    expect(session.getIsItemCompleted()).toBe(false);
  });

  it('should compose Hangul keystrokes during session', () => {
    session.processKey('r');
    expect(session.getUserInput()).toBe('ㄱ');
  });

  it('should ignore modifier keys such as Tab and Escape', () => {
    const resTab = session.processKey('Tab');
    expect(resTab.isMatch).toBe(false);

    const resEsc = session.processKey('Escape');
    expect(resEsc.isMatch).toBe(false);
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

  it('should allow backspacing to edit and re-type after completing a word', () => {
    session.processKey('r');
    session.processKey('k');
    expect(session.getIsItemCompleted()).toBe(true);
    expect(session.getUserInput()).toBe('가');

    session.processKey('Backspace');
    expect(session.getIsItemCompleted()).toBe(false);
    expect(session.getUserInput()).toBe('ㄱ');
    expect(session.getCurrentIndex()).toBe(0);

    session.processKey('k');
    expect(session.getIsItemCompleted()).toBe(true);
    expect(session.getUserInput()).toBe('가');
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
