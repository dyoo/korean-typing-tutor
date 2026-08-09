export type JamoType = 'Choseong' | 'Jungseong' | 'Jongseong';

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
