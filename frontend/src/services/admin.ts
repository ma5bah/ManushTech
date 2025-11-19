import api from './api';

export interface Region {
  id: number;
  name: string;
}

export interface Area {
  id: number;
  name: string;
  regionId: number;
}

export interface Distributor {
  id: number;
  name: string;
}

export interface Territory {
  id: number;
  name: string;
  areaId: number;
}

export const adminService = {
  getRegions: async (): Promise<Region[]> => {
    const response = await api.get('/admin/regions');
    return response.data;
  },
  createRegion: async (name: string): Promise<Region> => {
    const response = await api.post('/admin/regions', { name });
    return response.data;
  },
  updateRegion: async (id: number, name: string): Promise<Region> => {
    const response = await api.patch(`/admin/regions/${id}`, { name });
    return response.data;
  },
  deleteRegion: async (id: number): Promise<void> => {
    await api.delete(`/admin/regions/${id}`);
  },

  getAreas: async (): Promise<Area[]> => {
    const response = await api.get('/admin/areas');
    return response.data;
  },
  createArea: async (name: string, regionId: number): Promise<Area> => {
    const response = await api.post('/admin/areas', { name, regionId });
    return response.data;
  },
  updateArea: async (id: number, name: string, regionId: number): Promise<Area> => {
    const response = await api.patch(`/admin/areas/${id}`, { name, regionId });
    return response.data;
  },
  deleteArea: async (id: number): Promise<void> => {
    await api.delete(`/admin/areas/${id}`);
  },

  getDistributors: async (): Promise<Distributor[]> => {
    const response = await api.get('/admin/distributors');
    return response.data;
  },
  createDistributor: async (name: string): Promise<Distributor> => {
    const response = await api.post('/admin/distributors', { name });
    return response.data;
  },
  updateDistributor: async (id: number, name: string): Promise<Distributor> => {
    const response = await api.patch(`/admin/distributors/${id}`, { name });
    return response.data;
  },
  deleteDistributor: async (id: number): Promise<void> => {
    await api.delete(`/admin/distributors/${id}`);
  },

  getTerritories: async (): Promise<Territory[]> => {
    const response = await api.get('/admin/territories');
    return response.data;
  },
  createTerritory: async (name: string, areaId: number): Promise<Territory> => {
    const response = await api.post('/admin/territories', { name, areaId });
    return response.data;
  },
  updateTerritory: async (id: number, name: string, areaId: number): Promise<Territory> => {
    const response = await api.patch(`/admin/territories/${id}`, { name, areaId });
    return response.data;
  },
  deleteTerritory: async (id: number): Promise<void> => {
    await api.delete(`/admin/territories/${id}`);
  },

  // Retailers CRUD
  getRetailers: async (page = 1, limit = 20, search?: string): Promise<RetailerListResponse> => {
    const response = await api.get('/admin/retailers', {
      params: { page, limit, search },
    });
    return response.data;
  },

  getRetailer: async (id: number): Promise<Retailer> => {
    const response = await api.get(`/admin/retailers/${id}`);
    return response.data;
  },

  createRetailer: async (data: CreateRetailerData): Promise<Retailer> => {
    const response = await api.post('/admin/retailers', data);
    return response.data;
  },

  updateRetailer: async (id: number, data: Partial<CreateRetailerData>): Promise<Retailer> => {
    const response = await api.patch(`/admin/retailers/${id}`, data);
    return response.data;
  },

  deleteRetailer: async (id: number): Promise<void> => {
    await api.delete(`/admin/retailers/${id}`);
  },
};

export interface Retailer {
  id: number;
  name: string;
  phone: string | null;
  region: { id: number; name: string };
  area: { id: number; name: string };
  distributor: { id: number; name: string };
  territory: { id: number; name: string } | null;
  points: number;
  routes: string;
  notes: string;
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

export interface CreateRetailerData {
  name: string;
  phone?: string;
  regionId: number;
  areaId: number;
  distributorId: number;
  territoryId?: number;
  points?: number;
  routes?: string;
  notes?: string;
}

