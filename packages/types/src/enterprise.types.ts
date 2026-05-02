export interface Contract {
  id: string;
  contractNumber: string;
  organizationId: string;
  lenderName: string;
  principalAmount: number;
  apr: number;
  termMonths: number;
  collateral?: string | null;
  signedBy: string;
  status: 'DRAFT' | 'ACTIVE' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WRITTEN_OFF' | 'DISPUTED';
}

export interface ContractApproval {
  id: string;
  contractId: string;
  approvedBy: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Party {
  id: string;
  taxCode?: string | null;
  name: string;
  shortName?: string | null;
  internalCode: string;
  typeTags: string[];
  isRelatedParty: boolean;
  creditLimit: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLIST';
  createdAt: Date;
  updatedAt: Date;
}
