import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { retailersService } from '@/services/retailers';
import type { Retailer, UpdateRetailerData } from '@/services/retailers';
import { useAuth } from '@/contexts/AuthContext';

export default function RetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateRetailerData>({
    points: 0,
    routes: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      loadRetailer();
    }
  }, [id]);

  const loadRetailer = async () => {
    setLoading(true);
    try {
      const data = await retailersService.getOne(id!);
      setRetailer(data);
      setFormData({
        points: data.points,
        routes: data.routes,
        notes: data.notes,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to load retailer');
      navigate('/retailers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await retailersService.update(id, formData);
      alert('Retailer updated successfully');
      loadRetailer();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update retailer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!retailer) {
    return <div className="container mx-auto p-6">Retailer not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Retailer Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/retailers')}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Back to List
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Admin Dashboard
            </button>
          )}
          <button onClick={logout} className="px-4 py-2 border rounded hover:bg-gray-100">
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Retailer Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <p className="text-sm font-medium">{retailer.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <p className="text-sm font-medium">{retailer.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <p className="text-sm font-medium">{retailer.region.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Area</label>
              <p className="text-sm font-medium">{retailer.area.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Distributor</label>
              <p className="text-sm font-medium">{retailer.distributor.name}</p>
            </div>
            {retailer.territory && (
              <div>
                <label className="block text-sm font-medium mb-1">Territory</label>
                <p className="text-sm font-medium">{retailer.territory.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Update Fields</h2>
          <div className="space-y-4">
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

