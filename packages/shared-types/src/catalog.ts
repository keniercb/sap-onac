import type { UUID, ISODateString } from './common';

export interface CatalogItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CatalogItemWithUsage extends CatalogItem {
  usageCount: number;
}

export interface CreateCatalogItemDto {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCatalogItemDto extends Partial<CreateCatalogItemDto> {
  isActive?: boolean;
  version: number;
}

export interface HierarchicalCatalogItem extends CatalogItem {
  parentId: number | null;
  parent?: HierarchicalCatalogItem | null;
}

export type CatalogCode =
  | 'province'
  | 'municipality'
  | 'sex'
  | 'skin_color'
  | 'health_status'
  | 'pensioner_category'
  | 'civil_status'
  | 'labor_link'
  | 'pension_type'
  | 'er_front'
  | 'er_military_rank'
  | 'far_minint_rank'
  | 'medical_incacity_type'
  | 'incacity'
  | 'sequel'
  | 'gesta'
  | 'mission'
  | 'housing_type'
  | 'property_type'
  | 'association'
  | 'movement_cause'
  | 'kinship'
  | 'need_type'
  | 'electrodomestic'
  | 'phone_type'
  | 'cemetery'
  | 'crematorium'
  | 'disease';

export interface CatalogSummary {
  code: CatalogCode;
  name: string;
  description: string;
  count: number;
  hierarchical: boolean;
}
