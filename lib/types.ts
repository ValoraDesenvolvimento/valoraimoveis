import type { AddressDisplay } from "@/lib/address-display";

export type PropertyStatus = "Publicado" | "Rascunho";
export type IptuPeriod = "mensal" | "anual";

export type Broker = {
  name: string;
  creci: string;
  avatar: string;
};

export type CustomField = {
  label: string;
  value: string;
};

export type Property = {
  id: string;
  slug: string;
  title: string;
  location: string;
  locationFull: string;
  city: string;
  neighborhood: string;
  state: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  floors: number;
  towers: number;
  addressDisplay: AddressDisplay;
  latitude: string;
  longitude: string;
  type: string;
  typeLabel: string;
  price: number;
  priceLabel: string;
  ref: string;
  status: PropertyStatus;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  socialBathrooms: number;
  parking: number;
  area: number;
  builtArea: number;
  landArea: number;
  image: string;
  images: string[];
  featured: boolean;
  highlight: boolean;
  /** HTML sanitizado da descrição (rich text). */
  description: string;
  condo: string;
  condoExempt: boolean;
  iptu: string;
  iptuPeriod: IptuPeriod;
  iptuExempt: boolean;
  rooms: string[];
  leisure: string[];
  extras: string[];
  proximities: string[];
  customFields: CustomField[];
  roomsCustomFields: CustomField[];
  locationCustomFields: CustomField[];
  broker: Broker;
  createdAt: string;
  updatedAt: string;
};

export type PropertyInput = Omit<Property, "id" | "createdAt" | "updatedAt" | "priceLabel" | "location" | "locationFull" | "slug"> & {
  id?: string;
  slug?: string;
  priceLabel?: string;
  location?: string;
  locationFull?: string;
};

export type AdminPropertyListItem = {
  id: string;
  slug: string;
  title: string;
  ref: string;
  type: string;
  location: string;
  price: string;
  status: PropertyStatus;
  image: string;
};

export type UserRole = "Administrador" | "Editor";
export type UserStatus = "Ativo" | "Inativo";

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isDefault: boolean;
  initial: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
};
