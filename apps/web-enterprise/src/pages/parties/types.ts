export interface Contact {
  name: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
}

export interface Party {
  id: string;
  organizationId: string;
  taxCode: string;
  name: string;
  shortName?: string;
  internalCode: string;
  typeTags: string[];
  creditLimit: number;
  status: string;
  isRelatedParty: boolean;
  contacts: Contact[];
  bankAccounts: BankAccount[];
  personInChargeId?: string;
  personInCharge?: { id: string; fullName: string };
  createdAt: string;
}
