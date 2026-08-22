import { describe, it, expect, beforeEach } from 'vitest';
import { TutorSession } from './tutorSession.svelte';
import type { CurriculumData } from './tutorSession.svelte';

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
    localStorage.clear();
    session = new TutorSession(mockCurriculum, 'all', false);
    session.setMode('curriculum');
  });

  it('should initialize with Mastery Mode as default', () => {
    localStorage.clear();
    const defaultSession = new TutorSession(mockCurriculum, 'all', false);
    expect(defaultSession.getMode()).toBe('mastery');
  });

  it('should initialize cleanly from CurriculumData JSON format in curriculum mode', () => {
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
    session.setFilter('l3');
    expect(session.getSelectedFilter()).toBe('l3');
    expect(session.getTotalItems()).toBe(1);
    expect(session.getCurrentItem().target).toBe('사과');

    session.setFilter('l1', false);
    expect(session.getTotalItems()).toBe(1);
    expect(session.getCurrentItem().target).toBe('가');

    session.setFilter('all', false);
    expect(session.getTotalItems()).toBe(2);
  });

  it('should filter items by multiple module IDs array', () => {
    session.setFilter(['l1', 'l3'], false);
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
    expect(session.getAccuracy()).toBe(0);
    expect(session.getErrors().filter((e) => e.isError).length).toBe(1);
    expect(session.getErrors()[0].isError).toBe(true);

    session.processKey('Backspace');
    expect(session.getUserInput()).toBe('');
    expect(session.getAccuracy()).toBe(100);
    expect(session.getErrors().filter((e) => e.isError).length).toBe(0);
  });

  it('should mark item completed when full match is typed', () => {
    session.processKey('r');
    session.processKey('k');
    expect(session.getUserInput()).toBe('가');
    expect(session.getIsItemCompleted()).toBe(true);
    expect(session.getAccuracy()).toBe(100);
  });

  it('should advance to next item when Enter or Space is pressed upon completion', () => {
    session.processKey('r');
    session.processKey('k');
    expect(session.getIsItemCompleted()).toBe(true);

    const result = session.processKey('Enter');
    expect(result.advanced).toBe(true);
    expect(session.getCurrentIndex()).toBe(1);
    expect(session.getCurrentItem().target).toBe('사과');
    expect(session.getUserInput()).toBe('');
    expect(session.getIsItemCompleted()).toBe(false);
  });

  it('should shuffle items when advancing and cycling back', () => {
    session.setFilter('all', false);
    session.advanceLevel();
    expect(session.getCurrentIndex()).toBe(1);

    const isComplete = session.advanceLevel();
    expect(isComplete).toBe(true);
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

  it('should clamp cursor index to valid bounds on navigation boundaries', () => {
    session.setFilter('l3', false);
    session.processKey('t'); // ㅅ
    session.processKey('k'); // ㅏ -> 사
    expect(session.getInputCursorIndex()).toBe(1);

    // ArrowLeft at 0 clamps to 0
    session.processKey('Home');
    expect(session.getInputCursorIndex()).toBe(0);
    session.processKey('ArrowLeft');
    expect(session.getInputCursorIndex()).toBe(0);

    // ArrowRight past end clamps to length
    session.processKey('End');
    expect(session.getInputCursorIndex()).toBe(1);
    session.processKey('ArrowRight');
    expect(session.getInputCursorIndex()).toBe(1);

    // Direct clamped calls
    session.setInputCursorIndex(-10);
    expect(session.getInputCursorIndex()).toBe(0);
    session.setInputCursorIndex(100);
    expect(session.getInputCursorIndex()).toBe(1);
  });

  it('should support Arrow keys, Home, End navigation and mid-text deletion and insertion', () => {
    session.setFilter('l3', false); // target '사과'
    session.processKey('t'); // ㅅ
    session.processKey('k'); // ㅏ -> 사
    session.processKey('r'); // ㄱ
    session.processKey('h'); // ㅗ
    session.processKey('k'); // ㅏ -> 과 => '사과'
    expect(session.getUserInput()).toBe('사과');
    expect(session.getInputCursorIndex()).toBe(2);

    session.processKey('ArrowLeft');
    expect(session.getInputCursorIndex()).toBe(1);

    session.processKey('Home');
    expect(session.getInputCursorIndex()).toBe(0);

    session.processKey('End');
    expect(session.getInputCursorIndex()).toBe(2);

    session.processKey('ArrowLeft'); // index 1 (between '사' and '과')
    session.processKey('Backspace'); // deletes completed block '사'
    expect(session.getUserInput()).toBe('과');
    expect(session.getInputCursorIndex()).toBe(0);

    session.processKey('Delete'); // forward deletes '과' at index 0
    expect(session.getUserInput()).toBe('');
    expect(session.getInputCursorIndex()).toBe(0);
  });

  it('should construct composed Hangul blocks when typing at the beginning of an existing text (e.g. typing g+k+s before 국 -> 한국)', () => {
    session.processKey('r'); // ㄱ
    session.processKey('n'); // ㅜ
    session.processKey('r'); // ㄱ -> '국'
    expect(session.getUserInput()).toBe('국');

    session.processKey('Home'); // cursor index 0 before '국'
    expect(session.getInputCursorIndex()).toBe(0);

    session.processKey('g'); // ㅎ -> 'ㅎ국'
    expect(session.getUserInput()).toBe('ㅎ국');

    session.processKey('k'); // ㅏ -> '하국'
    expect(session.getUserInput()).toBe('하국');

    session.processKey('s'); // ㄴ -> '한국'
    expect(session.getUserInput()).toBe('한국');
  });

  it('should not alter completed prefix syllables when typing in front of another character', () => {
    session.setFilter('l3', false);
    session.processKey('r'); // ㄱ
    session.processKey('k'); // ㅏ -> 가
    session.processKey('s'); // ㄴ
    session.processKey('k'); // ㅏ -> 나 => '가나'
    expect(session.getUserInput()).toBe('가나');

    session.processKey('Home');
    session.processKey('ArrowRight'); // cursor index 1 (between '가' and '나')
    expect(session.getInputCursorIndex()).toBe(1);

    session.processKey('r'); // ㄱ -> '가ㄱ나'
    expect(session.getUserInput()).toBe('가ㄱ나');
    expect(session.getInputCursorIndex()).toBe(2);

    session.processKey('k'); // ㅏ -> '가가나'
    expect(session.getUserInput()).toBe('가가나');
    expect(session.getInputCursorIndex()).toBe(2);
  });

  it('should delete completed block when backspacing within a word', () => {
    session.setFilter('l3', false);
    session.processKey('t'); // ㅅ
    session.processKey('k'); // ㅏ -> 사
    session.processKey('r'); // ㄱ
    session.processKey('h'); // ㅗ
    session.processKey('k'); // ㅏ -> 과 => '사과'
    expect(session.getUserInput()).toBe('사과');

    session.processKey('ArrowLeft'); // cursor index 1 (between '사' and '과')
    expect(session.getInputCursorIndex()).toBe(1);

    session.processKey('Backspace'); // deletes completed block '사'
    expect(session.getUserInput()).toBe('과');
    expect(session.getInputCursorIndex()).toBe(0);
  });

  it('should decompose individual Jamos step-by-step when backspacing an incomplete block typed mid-word', () => {
    session.setFilter('l3', false);
    session.processKey('r'); // ㄱ
    session.processKey('k'); // ㅏ -> 가
    session.processKey('s'); // ㄴ
    session.processKey('k'); // ㅏ -> 나 => '가나'
    expect(session.getUserInput()).toBe('가나');

    session.processKey('Home');
    session.processKey('ArrowRight'); // cursor index 1 (between '가' and '나')
    expect(session.getInputCursorIndex()).toBe(1);

    session.processKey('r'); // ㄱ -> '가ㄱ나'
    session.processKey('n'); // ㅜ -> '가구나'
    session.processKey('r'); // ㄱ -> '가국나' (active batchim ㄱ)
    expect(session.getUserInput()).toBe('가국나');

    session.processKey('Backspace'); // decomposes active batchim 'ㄱ' -> '가구나'
    expect(session.getUserInput()).toBe('가구나');

    session.processKey('Backspace'); // decomposes active vowel 'ㅜ' -> '가ㄱ나'
    expect(session.getUserInput()).toBe('가ㄱ나');

    session.processKey('Backspace'); // removes active consonant 'ㄱ' -> '가나'
    expect(session.getUserInput()).toBe('가나');
    expect(session.getInputCursorIndex()).toBe(1);
  });

  it('should delete the completed preceding character block when backspacing once more after clearing an active incomplete mid-word block', () => {
    session.setFilter('l3', false);
    session.processKey('r'); // ㄱ
    session.processKey('k'); // ㅏ -> 가
    session.processKey('s'); // ㄴ
    session.processKey('k'); // ㅏ -> 나 => '가나'
    expect(session.getUserInput()).toBe('가나');

    session.processKey('Home');
    session.processKey('ArrowRight'); // cursor index 1 (between '가' and '나')
    expect(session.getInputCursorIndex()).toBe(1);

    session.processKey('r'); // ㄱ -> '가ㄱ나'
    session.processKey('n'); // ㅜ -> '가구나'
    session.processKey('r'); // ㄱ -> '가국나' (active batchim ㄱ)
    expect(session.getUserInput()).toBe('가국나');

    session.processKey('Backspace'); // decomposes active batchim 'ㄱ' -> '가구나'
    session.processKey('Backspace'); // decomposes active vowel 'ㅜ' -> '가ㄱ나'
    session.processKey('Backspace'); // removes active consonant 'ㄱ' -> '가나'
    expect(session.getUserInput()).toBe('가나');
    expect(session.getInputCursorIndex()).toBe(1);

    session.processKey('Backspace'); // deletes completed block '가' -> '나'
    expect(session.getUserInput()).toBe('나');
    expect(session.getInputCursorIndex()).toBe(0);
  });

  it('should support switching to Mastery Mode and managing Jamo progression', () => {
    session.setMode('mastery');
    expect(session.getMode()).toBe('mastery');

    const unlocked = session.getUnlockedJamos();
    expect(unlocked.has('ㅓ')).toBe(true);
    expect(unlocked.has('ㅏ')).toBe(true);
    expect(unlocked.has('ㅇ')).toBe(true);
    expect(unlocked.has('ㄹ')).toBe(true);

    const initialUnlockedCount = session.getMasteryState().unlockedCount;
    const newlyUnlocked = session.unlockNextJamoManually();
    expect(newlyUnlocked).toBe('ㅗ');
    expect(session.getMasteryState().unlockedCount).toBe(initialUnlockedCount + 1);

    session.setMasteryProgressionLevel(9);
    expect(session.getMasteryState().unlockedCount).toBe(9);
    expect(session.getUnlockedJamos().size).toBe(9);

    session.resetMasteryProgress();
    expect(session.getMasteryState().unlockedCount).toBe(4);

    session.setMode('curriculum');
    expect(session.getMode()).toBe('curriculum');
  });

  it('should maintain the active lesson item without swapping during mid-exercise Jamo unlocks', () => {
    session.setMode('mastery');
    const initialItem = session.getCurrentItem();

    // Type a key
    session.processKey('k'); // ㅏ
    // Item must remain the exact same item
    expect(session.getCurrentItem().id).toBe(initialItem.id);
  });

  it('should immediately save state to LocalStorage when completing an exercise (Issue #28)', () => {
    session.setMode('mastery');
    const item = session.getCurrentItem();
    localStorage.removeItem('korean_tutor_mastery');

    // Type the characters to complete the current item
    if (item.target === '어') {
      session.processKey('d'); // ㅇ
      session.processKey('j'); // ㅓ
    } else if (item.target === '아') {
      session.processKey('d'); // ㅇ
      session.processKey('k'); // ㅏ
    } else {
      for (const char of item.target) {
        if (char === '어') {
          session.processKey('d');
          session.processKey('j');
        } else if (char === '아') {
          session.processKey('d');
          session.processKey('k');
        } else {
          session.processKey(char);
        }
      }
    }

    expect(session.getIsItemCompleted()).toBe(true);
    const savedRaw = localStorage.getItem('korean_tutor_mastery');
    expect(savedRaw).not.toBeNull();
    const parsed = JSON.parse(savedRaw!);
    expect(parsed.mode).toBe('mastery');
  });

  it('should flush pending saves immediately when advancing levels (Issue #28)', () => {
    session.setMode('mastery');
    // Simulate typing a key that triggers debounced scheduleSave
    session.processKey('d');
    localStorage.removeItem('korean_tutor_mastery');

    // Advancing level must flush immediately
    session.advanceLevel();
    const savedRaw = localStorage.getItem('korean_tutor_mastery');
    expect(savedRaw).not.toBeNull();
  });

  it('should switch to post-game Batchim Workshop mode and serve 100% batchim-matching examples', async () => {
    const { hasBatchim } = await import('../utils/jamoMastery');
    session.setMode('mastery');
    session.setMasteryFocusBatchim('ㅋ');

    const target = session.getActiveMasteryTarget();
    expect(target.type).toBe('focus');
    if (target.type === 'focus') {
      expect(target.item.batchim).toBe('ㅋ');
    }

    // Every item served must have batchim 'ㅋ'
    for (let i = 0; i < 5; i++) {
      const currentItem = session.getCurrentItem();
      expect(hasBatchim(currentItem.target, 'ㅋ')).toBe(true);
      session.advanceLevel();
    }
  });

  it('should return upcoming lesson items for lookahead prefetching', () => {
    session.setMode('curriculum');
    session.setFilter('all', false);
    // mockCurriculum has 2 items: '가' (l1) and '사과' (l3)
    const upcoming = session.getUpcomingItems(5);
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].target).toBe('사과');

    // With 0 items (empty filter)
    session.setFilter([], false);
    expect(session.getUpcomingItems(5)).toEqual([]);
  });

  it('should serve exact precomputed items from mastery lookahead buffer', () => {
    session.setMode('mastery');
    const upcoming = session.getUpcomingItems(5);
    expect(upcoming.length).toBeGreaterThan(0);

    const nextExpected = upcoming[0];
    session.advanceLevel();
    expect(session.getCurrentItem().id).toBe(nextExpected.id);
  });
});
