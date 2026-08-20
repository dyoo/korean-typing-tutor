<script lang="ts">
  import type { KeyCapDefinition } from '../utils/keyboardData';
  import { calculateJamoProgress } from '../utils/jamoMastery';
  import VirtualKey from './VirtualKey.svelte';
  import type { TutorMode, JamoProgressionItem, JamoStats } from '../types/mastery';

  interface Props {
    cap: KeyCapDefinition;
    isShiftActive: boolean;
    isShiftPressed: boolean;
    activeKeys: string[];
    mode: TutorMode;
    unlockedJamos: Set<string>;
    activeJamo: JamoProgressionItem | null;
    jamoStats: Record<string, JamoStats>;
    onselect?: (key: string, e: MouseEvent) => void;
  }

  let {
    cap,
    isShiftActive,
    isShiftPressed,
    activeKeys,
    mode,
    unlockedJamos,
    activeJamo,
    jamoStats,
    onselect,
  }: Props = $props();

  let activeChar = $derived(isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo);
  let isLocked = $derived(
    mode === 'mastery' && unlockedJamos.size > 0 && !unlockedJamos.has(activeChar),
  );
  let isActiveLearning = $derived(mode === 'mastery' && activeJamo?.jamo === activeChar);
  let isMastered = $derived(mode === 'mastery' && (jamoStats[activeChar]?.isMastered ?? false));
  let progressPercent = $derived(
    mode === 'mastery' ? calculateJamoProgress(jamoStats[activeChar]) : 0,
  );
  let isTarget = $derived(activeKeys.includes(cap.key.toLowerCase()));
</script>

<VirtualKey
  {cap}
  {isTarget}
  isShiftActive={isShiftPressed}
  {isLocked}
  {isActiveLearning}
  {isMastered}
  {progressPercent}
  {onselect}
/>
