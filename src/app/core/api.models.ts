// Typed from StackApi v1 swagger.json (components/schemas).

export interface LatLngPointDto { lat: number; long: number; }
export interface GatePointDto { lat: number; long: number; }

export interface WrsAllocationDto { wrsNo: string | null; bags: number; netWeight: number; }

export interface ChamberResponseDto {
  id: number;
  warehouseId: number;
  chamberName: string | null;
  chamberNo: string | null;
  totalFloors: number | null;
  capacity: number | null;
  area: string | null;
  remarks: string | null;
  status: string | null;
  approvalStatus: string | null;
  gateLatitude: number | null;
  gateLongitude: number | null;
  latLng: LatLngPointDto[] | null;
}

export interface CreateChamberDto {
  warehouseId: number;
  chamberName?: string | null;
  chamberNo?: string | null;
  totalFloors?: number | null;
  capacity?: number | null;
  area?: string | null;
  remarks?: string | null;
}

export type UpdateChamberDto = Omit<CreateChamberDto, 'warehouseId'>;

export interface SaveChamberBoundaryDto {
  latLng: LatLngPointDto[] | null;
  gate?: GatePointDto;
}

export interface SetStackConfigDto {
  numberingPattern?: string | null;
  orientation?: string | null;
  gridRows: number;
  gridCols: number;
}

export interface StackResponseDto {
  id: number;
  chamberId: number;
  chamberName: string | null;
  stackName: string | null;
  positionRow: number | null;
  positionCol: number | null;
  positionSequence: number | null;
  positionPattern: string | null;
  isPositioned: boolean;
  totalBags: number;
  totalNetWeight: number;
  selectedViews: string[] | null;
  wrsAllocations: WrsAllocationDto[] | null;
}

export interface StackConfigResponseDto {
  chamberId: number;
  numberingPattern: string | null;
  orientation: string | null;
  gridRows: number;
  gridCols: number;
  isConfirmed: boolean;
  readonly totalCells: number;
  positionedCount: number;
  positionedStacks: StackResponseDto[] | null;
}

export interface SaveStackDto {
  stackName?: string | null;
  positionRow?: number | null;
  positionCol?: number | null;
  positionSequence?: number | null;
  positionPattern?: string | null;
  selectedViews?: string[] | null;
  wrsAllocations?: WrsAllocationDto[] | null;
}
export type UpdateStackDto = SaveStackDto;
export interface StackSetupItemDto extends SaveStackDto { id?: number | null; }

export interface SetStackPositionDto {
  positionRow: number;
  positionCol: number;
  positionSequence: number;
  positionPattern?: string | null;
}

export interface CompleteChamberSetupDto {
  chamberId?: number | null;
  chamber?: CreateChamberDto;
  boundary?: SaveChamberBoundaryDto;
  stackConfig?: SetStackConfigDto;
  stacks?: StackSetupItemDto[] | null;
  confirm: boolean;
  submit: boolean;
}

export interface CompleteChamberSetupResponseDto {
  chamber: ChamberResponseDto;
  stackConfig: StackConfigResponseDto;
  stacks: StackResponseDto[] | null;
  unassignedStacksInWarehouse: StackResponseDto[] | null;
}

export interface StackBlockModel { blockNo?: number | null; danda: number; patta: number; height: number; }

export interface WHRStackItem { wrsNo: string | null; bags: number; netWet: number; }
export interface WHRStackMappingRequest {
  stackNo: string | null;
  wid: number;
  entBy: number;
  wrsList: WHRStackItem[] | null;
}

// ---- multipart/form-data requests ----

export interface StackInspectionForm {
  ReportType?: string;
  WarehouseId?: number;
  ChamberNo?: string;
  EntBy?: number;
  StackNo?: string;
  StackPosition?: string;
  CommodityId?: number;
  BankId?: number;
  CommodityName?: string;
  BagCount?: number;
  NetWet?: number;
  ExtraBags?: number;
  Remarks?: string;
  Blocks?: StackBlockModel[];
  LockPhoto?: Blob;
  FrontImage?: Blob;
  BackImage?: Blob;
  LeftImage?: Blob;
  RightImage?: Blob;
  TopImage?: Blob;
  StackCardImage?: Blob;
  SampleCommodityImage?: Blob;
}

export interface WarehouseStatusForm {
  WarehouseId?: number;
  StatusDate?: string; // yyyy-MM-dd
  Fromdate?: string;
  Enddate?: string;
  Statustype?: string;
  Remarks?: string;
  CreatedBy?: number;
  Image?: Blob;
}

export interface EmployeeDocumentForm { EmpId: number; DocumentType: string; File: Blob; }

export interface EmployeeRegisterForm {
  EmpName?: string; FatherName?: string; Gender?: string; BirthDate?: string;
  ContactNo?: string; CurrentAddress?: string; PermanentAddress?: string;
  Qualification?: string; EmailId?: string; State?: string; REC_Staus?: number;
  AadhaarNo?: string; PanNo?: string; MaritalStatus?: string; RelativeContact?: string;
  IFSC?: string; BankName?: string; BranchName?: string; AccountHolderName?: string; AccountNo?: string;
  Photo?: Blob; Sign?: Blob; AadhaarFront?: Blob; AadhaarBack?: Blob; PanPhoto?: Blob;
  Passbook?: Blob; Resume?: Blob; CharacterCertificate?: Blob; PoliceVerification?: Blob;
  Form11?: Blob; ExperienceLetter?: Blob;
}

export const STACK_IMAGE_FIELDS = [
  'FrontImage', 'BackImage', 'LeftImage', 'RightImage', 'TopImage', 'StackCardImage', 'SampleCommodityImage', 'LockPhoto',
] as const;
export type StackImageField = (typeof STACK_IMAGE_FIELDS)[number];
