export type JamoType = 'choseong' | 'jungseong' | 'jongseong';

export interface JamoMapping {
  key: string;
  jamo: string;
  type: JamoType;
}

export interface CompositionState {
  chosung: string | null;
  jungseong: string | null;
  jongseong: string | null;
}

export interface ErrorReport {
  index: number;
  isError: boolean;
}

export interface LessonItem {
  id: string;
  type: string;
  target: string;
  pronunciation: string | null;
  translation: string | null;
}
