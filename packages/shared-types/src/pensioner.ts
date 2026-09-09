import type { UUID, ISODateString } from './common';

export enum PensionerState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DECEASED = 'deceased',
  REINCORPORATED_SMA = 'reincorporated_sma',
}

export interface Pensioner {
  id: UUID;
  consecutiveNumber: number;
  identityCard: string;
  certificateSerial: string | null;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  knownAs: string | null;
  fullName: string;
  displayName: string;
  address: string | null;
  provinceId: number;
  municipalityId: number;
  sexId: number | null;
  skinColorId: number | null;
  healthStatusId: number | null;
  categoryId: number | null;
  civilStatusId: number | null;
  laborLinkId: number | null;
  salary: number | null;
  aep: boolean | null;
  pmtAmount: number | null;
  pensionTypeId: number | null;
  grantedBy: string | null;
  socialSecurityPension: number | null;
  bankControlNumber: string | null;
  housingTypeId: number | null;
  propertyTypeId: number | null;
  currentState: PensionerState;
  deceasedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  // Relaciones
  province?: CatalogRef;
  municipality?: CatalogRef;
  sex?: CatalogRef | null;
  skinColor?: CatalogRef | null;
  healthStatus?: CatalogRef | null;
  category?: CatalogRef | null;
  civilStatus?: CatalogRef | null;
  laborLink?: CatalogRef | null;
  pensionType?: CatalogRef | null;
  housingType?: CatalogRef | null;
  propertyType?: CatalogRef | null;
}

export interface CatalogRef {
  id: number;
  name: string;
  code: string;
}

export interface CreatePensionerDto {
  identityCard: string;
  certificateSerial?: string;
  firstName: string;
  lastName1: string;
  lastName2?: string;
  knownAs?: string;
  address?: string;
  provinceId: number;
  municipalityId: number;
  sexId?: number;
  skinColorId?: number;
  healthStatusId?: number;
  categoryId?: number;
  civilStatusId?: number;
  laborLinkId?: number;
  salary?: number;
  aep?: boolean;
  pmtAmount?: number;
  pensionTypeId?: number;
  grantedBy?: string;
  socialSecurityPension?: number;
  bankControlNumber?: string;
  housingTypeId?: number;
  propertyTypeId?: number;
}

export interface UpdatePensionerDto extends Partial<CreatePensionerDto> {
  version: number;
}

export interface PensionerFilters {
  provinceId?: number;
  municipalityId?: number;
  categoryId?: number;
  currentState?: PensionerState;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
