<script lang="ts">
  import CharDisplay from './CharDisplay.svelte';
  import type { ErrorReport } from '../types/korean';
  import type { CursorColorMode } from '../utils/cursorColor';

  interface Props {
    userInput: string;
    errors: ErrorReport[];
    activeInputCursorIndex: number;
    isCompleted: boolean;
    hasEnabledModules: boolean;
    cursorColor?: CursorColorMode;
    inputElement?: HTMLInputElement | null;
    onkeydown: (e: KeyboardEvent) => void;
    onkeyup?: (e: KeyboardEvent) => void;
    oninputprevent: (e: Event) => void;
    onsetcursorposition: (index: number) => void;
    onfocuscontainer?: (e?: MouseEvent) => void;
  }

  let {
    userInput,
    errors,
    activeInputCursorIndex,
    isCompleted,
    hasEnabledModules,
    cursorColor = 'amber',
    inputElement = $bindable(null),
    onkeydown,
    onkeyup,
    oninputprevent,
    onsetcursorposition,
    onfocuscontainer,
  }: Props = $props();

  let inputContainerElement = $state<HTMLDivElement | null>(null);
  let activeCursorElement = $state<HTMLElement | null>(null);

  $effect(() => {
    if (
      userInput !== undefined &&
      activeInputCursorIndex !== undefined &&
      activeCursorElement &&
      inputContainerElement
    ) {
      activeCursorElement.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  });
</script>

<div
  class="w-full h-24 md:h-28 relative flex justify-center items-center bg-white dark:bg-gray-800 font-bold shadow-md rounded-xl px-4 overflow-hidden cursor-text"
  onclick={onfocuscontainer}
>
  {#if userInput.length === 0}
    <span
      class="text-xl md:text-2xl text-gray-400 dark:text-gray-500 font-normal text-center whitespace-nowrap select-none"
    >
      {!hasEnabledModules
        ? 'Select a module above to begin...'
        : isCompleted
          ? 'Press Enter or Space for next word'
          : 'Start typing...'}
    </span>
  {:else}
    <div
      bind:this={inputContainerElement}
      class="input-display flex flex-nowrap items-center whitespace-nowrap max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-giant font-bold select-text z-10"
    >
      {#each userInput.split('') as char, i}
        {@const isError = errors.find((e) => e.index === i)?.isError ?? false}
        {@const isLeading = i === activeInputCursorIndex}
        {@const isTrailing = i === activeInputCursorIndex - 1}
        {@const isCurrent = isLeading || isTrailing}

        {#if isCurrent}
          <CharDisplay
            bind:elementRef={activeCursorElement}
            {char}
            {isError}
            {isCurrent}
            isLeadingCursor={isLeading}
            variant="input"
            dataIndex={i}
            {cursorColor}
            onselect={() => onsetcursorposition(i + 1)}
          />
        {:else}
          <CharDisplay
            {char}
            {isError}
            {isCurrent}
            variant="input"
            dataIndex={i}
            {cursorColor}
            onselect={() => onsetcursorposition(i + 1)}
          />
        {/if}
      {/each}
    </div>
  {/if}

  <input
    bind:this={inputElement}
    type="text"
    inputmode="none"
    class="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-0"
    value={userInput}
    {onkeydown}
    {onkeyup}
    oninput={oninputprevent}
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
  />
</div>
