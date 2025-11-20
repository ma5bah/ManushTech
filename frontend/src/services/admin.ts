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

export interface SalesRep {
  id: number;
  username: string;
  email: string;
  phone: string | null;
}

export const adminService = {
  getRegions: async (): Promise<Region[]> => {
    const response = await api.get('/admin/regions');
    return response.data.data;
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
    return response.data.data;
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
    return response.data.data;
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
    return response.data.data;
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

  // Used for bulk assignment (fetches larger list)
  getRetailersForAssignment: async (): Promise<Retailer[]> => {
    // Fetch a larger batch for assignment UI
    const response = await api.get('/admin/retailers', {
      params: { page: 1, limit: 1000 }, 
    });
    return response.data.data;
  },

  getSalesReps: async (): Promise<SalesRep[]> => {
    const response = await api.get('/admin/sales-reps');
    return response.data.data;
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

  // Bulk assign
  bulkAssignRetailers: async (data: BulkAssignData): Promise<void> => {
    await api.post('/admin/assignments/bulk', data);
  },

  // Import
  importRetailers: async (file: File): Promise<{ imported: number; skipped: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/retailers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export interface BulkAssignData {
  salesRepId: number | null; // null for unassign
  retailerIds: number[];
  action?: 'assign' | 'unassign'; // Optional because logic might infer it
}

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
  salesRepId?: number; // For assignment UI
  assignments?: { salesRep: { id: number; name: string } }[];
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
