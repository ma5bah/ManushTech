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
};

