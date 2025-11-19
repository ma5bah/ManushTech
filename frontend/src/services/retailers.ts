import api from './api';

export interface Retailer {
  id: number;
  name: string;
  phone: string | null;
  region: { name: string };
  area: { name: string };
  distributor: { name: string };
  territory: { name: string } | null;
  points: number;
  routes: string;
  notes: string;
  updatedAt: string;
}

export interface RetailerListResponse {
  data: Retailer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RetailerQuery {
  page?: number;
  limit?: number;
  search?: string;
  regionId?: string;
  areaId?: string;
  distributorId?: string;
  territoryId?: string;
}

export interface UpdateRetailerData {
  points?: number;
  routes?: string;
  notes?: string;
}

export const retailersService = {
  getList: async (query: RetailerQuery): Promise<RetailerListResponse> => {
    const response = await api.get('/retailers', { params: query });
    return response.data;
  },

  getOne: async (id: string): Promise<Retailer> => {
    const response = await api.get(`/retailers/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateRetailerData): Promise<Retailer> => {
    const response = await api.patch(`/retailers/${id}`, data);
    return response.data;
  },
};

