import type {
  AiDraftRequest,
  AiDraftResponse,
  AuthUser,
  CategoryDto,
  InvoiceDto,
  InvoiceStatus,
  ItemDto,
  OfferDto,
  OfferStatus,
  SessionResponse,
  SubcategoryDto,
  TeamMemberDto,
  UserRole,
} from 'shared-types';
import { http } from './client';

/* ---- Input shapes (what the client sends) ------------------------------ */

export interface ItemInput {
  description: string;
  unit: string;
  price: number;
  currency?: string;
  categoryId: string;
  subcategoryId?: string | null;
}

export interface LineInput {
  itemId?: string;
  description?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
}

export interface OfferInput {
  title?: string;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  currency?: string;
  taxRate?: number;
  status?: OfferStatus;
  items: LineInput[];
}

export interface InvoiceInput {
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  currency?: string;
  taxRate?: number;
  status?: InvoiceStatus;
  issuedAt?: string;
  dueAt?: string;
  items: LineInput[];
}

export type CategoryListItem = CategoryDto & {
  _count?: { items: number; subcategories: number };
};
export type CategoryDetail = CategoryDto & {
  subcategories: SubcategoryDto[];
  _count?: { items: number };
};

export interface TeamMemberInput {
  email: string;
  fullName?: string;
  role?: UserRole;
}

export interface ItemQuery {
  categoryId?: string;
  subcategoryId?: string;
  search?: string;
  take?: number;
  skip?: number;
}

const qs = (q: object): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

/* ---- Resource clients --------------------------------------------------- */

export const api = {
  auth: {
    login: (email: string, password: string) =>
      http.post<SessionResponse>('/auth/login', { email, password }),
    me: () => http.get<AuthUser>('/auth/me'),
  },

  categories: {
    list: () => http.get<CategoryListItem[]>('/categories'),
    get: (id: string) => http.get<CategoryDetail>(`/categories/${id}`),
    create: (data: { slug: string; name: string; sourceUrl?: string }) =>
      http.post<CategoryDto>('/categories', data),
    update: (id: string, data: Partial<{ slug: string; name: string }>) =>
      http.patch<CategoryDto>(`/categories/${id}`, data),
    remove: (id: string) => http.del<void>(`/categories/${id}`),
  },

  items: {
    list: (q: ItemQuery = {}) => http.get<ItemDto[]>(`/items${qs(q)}`),
    get: (id: string) => http.get<ItemDto>(`/items/${id}`),
    create: (data: ItemInput) => http.post<ItemDto>('/items', data),
    update: (id: string, data: Partial<ItemInput>) =>
      http.patch<ItemDto>(`/items/${id}`, data),
    remove: (id: string) => http.del<void>(`/items/${id}`),
  },

  offers: {
    list: () => http.get<OfferDto[]>('/offers'),
    get: (id: string) => http.get<OfferDto>(`/offers/${id}`),
    create: (data: OfferInput) => http.post<OfferDto>('/offers', data),
    update: (id: string, data: Partial<OfferInput>) =>
      http.patch<OfferDto>(`/offers/${id}`, data),
    remove: (id: string) => http.del<void>(`/offers/${id}`),
  },

  invoices: {
    list: () => http.get<InvoiceDto[]>('/invoices'),
    get: (id: string) => http.get<InvoiceDto>(`/invoices/${id}`),
    create: (data: InvoiceInput) => http.post<InvoiceDto>('/invoices', data),
    fromOffer: (offerId: string, data: { dueAt?: string } = {}) =>
      http.post<InvoiceDto>(`/invoices/from-offer/${offerId}`, data),
    update: (id: string, data: Partial<InvoiceInput>) =>
      http.patch<InvoiceDto>(`/invoices/${id}`, data),
    remove: (id: string) => http.del<void>(`/invoices/${id}`),
  },

  ai: {
    draftOffer: (req: AiDraftRequest) =>
      http.post<AiDraftResponse>('/ai/draft-offer', req),
  },

  team: {
    list: () => http.get<TeamMemberDto[]>('/team/members'),
    create: (data: TeamMemberInput) =>
      http.post<TeamMemberDto>('/team/members', data),
    update: (id: string, data: Partial<Omit<TeamMemberInput, 'email'>>) =>
      http.patch<TeamMemberDto>(`/team/members/${id}`, data),
    remove: (id: string) => http.del<void>(`/team/members/${id}`),
  },
};
