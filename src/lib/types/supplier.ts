export interface SupplierContactInput {
  name: string;
  jobTitle: string;
  phone: string;
  email: string;
}

export interface SupplierChannelInput {
  kind: "messenger" | "social";
  channel: string;
  value: string;
}

export interface SupplierCustomFieldInput {
  label: string;
  value: string;
}

export interface SupplierFormInput {
  name: string;
  type: string;
  isActive: boolean;
  website: string;
  country: string;
  city: string;
  address: string;
  notes: string;
  contacts: SupplierContactInput[];
  channels: SupplierChannelInput[];
  customFields: SupplierCustomFieldInput[];
}
