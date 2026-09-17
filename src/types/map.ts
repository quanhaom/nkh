export interface ProvinceInteractiveData {
  province: string;
  siteName?: string;
  remainsFound?: number;
  gravesFound?: number;
  summary?: string;
  details?: string[];
}

export interface SelectedProvince
  extends ProvinceInteractiveData {
  tracked: boolean;
}