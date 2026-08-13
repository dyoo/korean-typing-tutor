<script lang="ts">
  interface Props {
    min?: number;
    max?: number;
    step?: number;
    minValue: number;
    maxValue: number;
    onminchange: (val: number) => void;
    onmaxchange: (val: number) => void;
  }

  let {
    min = 1.0,
    max = 6.0,
    step = 0.25,
    minValue,
    maxValue,
    onminchange,
    onmaxchange,
  }: Props = $props();

  let trackEl = $state<HTMLDivElement | null>(null);

  function clampAndStep(val: number): number {
    const clamped = Math.max(min, Math.min(max, val));
    const stepped = Math.round((clamped - min) / step) * step + min;
    return parseFloat(stepped.toFixed(2));
  }

  function getValueFromPointer(e: PointerEvent): number {
    if (!trackEl) return minValue;
    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return clampAndStep(min + ratio * (max - min));
  }

  function handlePointerDown(e: PointerEvent, defaultHandle: 'min' | 'max' | 'auto') {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const isOverlap = minValue === maxValue;
    let activeHandle: 'min' | 'max' | 'auto' = isOverlap ? 'auto' : defaultHandle;

    const onPointerMove = (moveEv: PointerEvent) => {
      const val = getValueFromPointer(moveEv);

      if (activeHandle === 'auto') {
        if (val < minValue) {
          activeHandle = 'min';
        } else if (val > maxValue) {
          activeHandle = 'max';
        } else {
          return;
        }
      }

      if (activeHandle === 'min') {
        onminchange(Math.min(val, maxValue));
      } else {
        onmaxchange(Math.max(val, minValue));
      }
    };

    const onPointerUp = (upEv: PointerEvent) => {
      try {
        target.releasePointerCapture(upEv.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  }

  function handleTrackPointerDown(e: PointerEvent) {
    if (!trackEl) return;
    const val = getValueFromPointer(e);
    const distMin = Math.abs(val - minValue);
    const distMax = Math.abs(val - maxValue);

    if (distMin < distMax) {
      onminchange(Math.min(val, maxValue));
      handlePointerDown(e, 'min');
    } else if (distMax < distMin) {
      onmaxchange(Math.max(val, minValue));
      handlePointerDown(e, 'max');
    } else {
      if (val < minValue) {
        onminchange(val);
        handlePointerDown(e, 'min');
      } else if (val > maxValue) {
        onmaxchange(val);
        handlePointerDown(e, 'max');
      } else {
        handlePointerDown(e, 'auto');
      }
    }
  }

  let minPercent = $derived(Math.min(100, Math.max(0, ((minValue - min) / (max - min)) * 100)));
  let maxPercent = $derived(Math.min(100, Math.max(0, ((maxValue - min) / (max - min)) * 100)));
</script>

<div
  bind:this={trackEl}
  onpointerdown={handleTrackPointerDown}
  role="presentation"
  class="relative w-full h-8 flex items-center select-none cursor-pointer py-1"
>
  <!-- Track Background -->
  <div class="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>

  <!-- Active Range Highlight -->
  <div
    class="absolute h-2 bg-blue-600 dark:bg-blue-500 rounded-lg pointer-events-none"
    style="left: {minPercent}%; width: {Math.max(0, maxPercent - minPercent)}%;"
  ></div>

  <!-- Min Thumb Knob -->
  <div
    role="slider"
    aria-label="Minimum Font Size"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={minValue}
    tabindex="0"
    onpointerdown={(e) => handlePointerDown(e, 'min')}
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        onminchange(Math.max(min, Math.min(maxValue, minValue - step)));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        onminchange(Math.min(maxValue, minValue + step));
      }
    }}
    class="absolute w-5 h-5 bg-white dark:bg-gray-200 border-2 border-blue-600 dark:border-blue-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 z-20"
    style="left: calc({minPercent}% - 10px);"
  ></div>

  <!-- Max Thumb Knob -->
  <div
    role="slider"
    aria-label="Maximum Font Size"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={maxValue}
    tabindex="0"
    onpointerdown={(e) => handlePointerDown(e, 'max')}
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        onmaxchange(Math.max(minValue, maxValue - step));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        onmaxchange(Math.min(max, maxValue + step));
      }
    }}
    class="absolute w-5 h-5 bg-white dark:bg-gray-200 border-2 border-blue-600 dark:border-blue-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 z-30"
    style="left: calc({maxPercent}% - 10px);"
  ></div>
</div>
