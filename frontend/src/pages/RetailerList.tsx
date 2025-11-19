import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { retailersService } from '@/services/retailers';
import type { Retailer, RetailerQuery } from '@/services/retailers';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, type CreateRetailerData } from '@/services/admin';

export default function RetailerList() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState<RetailerQuery>({ page: 1, limit: 20 });
  const [regions, setRegions] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateRetailerData>({
    name: '',
    phone: '',
    regionId: 0,
    areaId: 0,
    distributorId: 0,
    territoryId: undefined,
    points: 0,
    routes: '',
    notes: '',
  });
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadRetailers();
    loadFilters();
  }, [query]);

  const loadFilters = async () => {
    try {
      const [regionsData, areasData, distributorsData, territoriesData] = await Promise.all([
        adminService.getRegions().catch(() => []),
        adminService.getAreas().catch(() => []),
        adminService.getDistributors().catch(() => []),
        adminService.getTerritories().catch(() => []),
      ]);
      setRegions(regionsData);
      setAreas(areasData);
      setDistributors(distributorsData);
      setTerritories(territoriesData);
    } catch (error) {
      console.error('Failed to load filters', error);
    }
  };

  const loadRetailers = async () => {
    setLoading(true);
    try {
      const response = await retailersService.getList(query);
      setRetailers(response.data);
      setPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to load retailers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setQuery({ ...query, search, page: 1 });
  };

  const handleFilter = (key: keyof RetailerQuery, value: string) => {
    setQuery({ ...query, [key]: value === 'all' ? undefined : value, page: 1 });
  };

  const handleCreate = async () => {
    try {
      await adminService.createRetailer(formData);
      alert('Retailer created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        phone: '',
        regionId: 0,
        areaId: 0,
        distributorId: 0,
        territoryId: undefined,
        points: 0,
        routes: '',
        notes: '',
      });
      loadRetailers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create retailer');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this retailer?')) return;
    try {
      await adminService.deleteRetailer(id);
      alert('Retailer deleted successfully');
      loadRetailers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete retailer');
    }
  };

  const filteredAreas = areas.filter(a => !formData.regionId || a.regionId === formData.regionId);
  const filteredTerritories = territories.filter(t => !formData.areaId || t.areaId === formData.areaId);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Retailers</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Retailer
              </button>
            </>
          )}
          <button onClick={logout} className="px-4 py-2 border rounded hover:bg-gray-100">
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Search & Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name, phone..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <select
            onChange={(e) => handleFilter('regionId', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => handleFilter('areaId', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="all">All Areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => handleFilter('distributorId', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="all">All Distributors</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => handleFilter('territoryId', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="all">All Territories</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="space-y-4">
            {retailers.map((retailer) => (
              <div
                key={retailer.id}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 relative"
                onClick={() => navigate(`/retailers/${retailer.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{retailer.name}</h3>
                    <p className="text-sm text-gray-600">{retailer.phone}</p>
                    <div className="mt-2 text-sm">
                      <span>{retailer.region.name}</span> / <span>{retailer.area.name}</span>
                      {retailer.territory && <> / <span>{retailer.territory.name}</span></>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">Points: {retailer.points}</div>
                    <div className="text-sm text-gray-600">{retailer.distributor.name}</div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => handleDelete(retailer.id, e)}
                    className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setQuery({ ...query, page: page - 1 })}
              disabled={page === 1}
              className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setQuery({ ...query, page: page + 1 })}
              disabled={page >= totalPages}
              className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Retailer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Region *</label>
                <select
                  value={formData.regionId}
                  onChange={(e) => setFormData({ ...formData, regionId: parseInt(e.target.value), areaId: 0, territoryId: undefined })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="0">Select region</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Area *</label>
                <select
                  value={formData.areaId}
                  onChange={(e) => setFormData({ ...formData, areaId: parseInt(e.target.value), territoryId: undefined })}
                  className="w-full px-3 py-2 border rounded"
                  disabled={!formData.regionId}
                >
                  <option value="0">Select area</option>
                  {filteredAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distributor *</label>
                <select
                  value={formData.distributorId}
                  onChange={(e) => setFormData({ ...formData, distributorId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="0">Select distributor</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Territory</label>
                <select
                  value={formData.territoryId || 0}
                  onChange={(e) => setFormData({ ...formData, territoryId: e.target.value === '0' ? undefined : parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  disabled={!formData.areaId}
                >
                  <option value="0">None</option>
                  {filteredTerritories.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Routes</label>
                <input
                  type="text"
                  value={formData.routes}
                  onChange={(e) => setFormData({ ...formData, routes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                disabled={!formData.name || !formData.regionId || !formData.areaId || !formData.distributorId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

