import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, type Region, type Area, type Distributor, type Territory } from '@/services/admin';

export default function Admin() {
  const { logout } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [activeTab, setActiveTab] = useState<'regions' | 'areas' | 'distributors' | 'territories'>('regions');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [regionsData, areasData, distributorsData, territoriesData] = await Promise.all([
        adminService.getRegions(),
        adminService.getAreas(),
        adminService.getDistributors(),
        adminService.getTerritories(),
      ]);
      setRegions(regionsData);
      setAreas(areasData);
      setDistributors(distributorsData);
      setTerritories(territoriesData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={logout} className="px-4 py-2 border rounded hover:bg-gray-100">
          Logout
        </button>
      </div>

      <div className="border-b mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('regions')}
            className={`pb-2 px-4 ${activeTab === 'regions' ? 'border-b-2 border-blue-600' : ''}`}
          >
            Regions
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`pb-2 px-4 ${activeTab === 'areas' ? 'border-b-2 border-blue-600' : ''}`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab('distributors')}
            className={`pb-2 px-4 ${activeTab === 'distributors' ? 'border-b-2 border-blue-600' : ''}`}
          >
            Distributors
          </button>
          <button
            onClick={() => setActiveTab('territories')}
            className={`pb-2 px-4 ${activeTab === 'territories' ? 'border-b-2 border-blue-600' : ''}`}
          >
            Territories
          </button>
        </div>
      </div>

      {activeTab === 'regions' && (
        <RegionsTab regions={regions} onRefresh={loadAll} />
      )}
      {activeTab === 'areas' && (
        <AreasTab areas={areas} regions={regions} onRefresh={loadAll} />
      )}
      {activeTab === 'distributors' && (
        <DistributorsTab distributors={distributors} onRefresh={loadAll} />
      )}
      {activeTab === 'territories' && (
        <TerritoriesTab territories={territories} areas={areas} onRefresh={loadAll} />
      )}
    </div>
  );
}

function RegionsTab({ regions, onRefresh }: { regions: Region[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Region | null>(null);

  const handleCreate = async () => {
    try {
      await adminService.createRegion(name);
      setOpen(false);
      setName('');
      onRefresh();
    } catch (error) {
      alert('Failed to create region');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateRegion(editing.id, name);
      setOpen(false);
      setEditing(null);
      setName('');
      onRefresh();
    } catch (error) {
      alert('Failed to update region');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteRegion(id);
      onRefresh();
    } catch (error) {
      alert('Failed to delete region');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Regions</h2>
        <button
          onClick={() => { setEditing(null); setName(''); setOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Region
        </button>
      </div>

      {open && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">{editing ? 'Edit' : 'Create'} Region</h3>
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Region name"
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setOpen(false); setEditing(null); setName(''); }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {regions.map((region) => (
          <div key={region.id} className="flex justify-between items-center p-2 border rounded">
            <span>{region.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(region);
                  setName(region.name);
                  setOpen(true);
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(region.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreasTab({ areas, regions, onRefresh }: { areas: Area[]; regions: Region[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [regionId, setRegionId] = useState('');
  const [editing, setEditing] = useState<Area | null>(null);

  const handleCreate = async () => {
    try {
      await adminService.createArea(name, parseInt(regionId));
      setOpen(false);
      setName('');
      setRegionId('');
      onRefresh();
    } catch (error) {
      alert('Failed to create area');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateArea(editing.id, name, parseInt(regionId));
      setOpen(false);
      setEditing(null);
      setName('');
      setRegionId('');
      onRefresh();
    } catch (error) {
      alert('Failed to update area');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteArea(id);
      onRefresh();
    } catch (error) {
      alert('Failed to delete area');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Areas</h2>
        <button
          onClick={() => { setEditing(null); setName(''); setRegionId(''); setOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Area
        </button>
      </div>

      {open && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">{editing ? 'Edit' : 'Create'} Area</h3>
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Area name"
              className="w-full px-3 py-2 border rounded"
            />
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setOpen(false); setEditing(null); setName(''); setRegionId(''); }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {areas.map((area) => (
          <div key={area.id} className="flex justify-between items-center p-2 border rounded">
            <span>{area.name} (Region: {regions.find(r => r.id === area.regionId)?.name})</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(area);
                  setName(area.name);
                  setRegionId(area.regionId.toString());
                  setOpen(true);
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(area.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributorsTab({ distributors, onRefresh }: { distributors: Distributor[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Distributor | null>(null);

  const handleCreate = async () => {
    try {
      await adminService.createDistributor(name);
      setOpen(false);
      setName('');
      onRefresh();
    } catch (error) {
      alert('Failed to create distributor');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateDistributor(editing.id, name);
      setOpen(false);
      setEditing(null);
      setName('');
      onRefresh();
    } catch (error) {
      alert('Failed to update distributor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteDistributor(id);
      onRefresh();
    } catch (error) {
      alert('Failed to delete distributor');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Distributors</h2>
        <button
          onClick={() => { setEditing(null); setName(''); setOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Distributor
        </button>
      </div>

      {open && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">{editing ? 'Edit' : 'Create'} Distributor</h3>
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Distributor name"
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setOpen(false); setEditing(null); setName(''); }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {distributors.map((distributor) => (
          <div key={distributor.id} className="flex justify-between items-center p-2 border rounded">
            <span>{distributor.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(distributor);
                  setName(distributor.name);
                  setOpen(true);
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(distributor.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerritoriesTab({ territories, areas, onRefresh }: { territories: Territory[]; areas: Area[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [editing, setEditing] = useState<Territory | null>(null);

  const handleCreate = async () => {
    try {
      await adminService.createTerritory(name, parseInt(areaId));
      setOpen(false);
      setName('');
      setAreaId('');
      onRefresh();
    } catch (error) {
      alert('Failed to create territory');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateTerritory(editing.id, name, parseInt(areaId));
      setOpen(false);
      setEditing(null);
      setName('');
      setAreaId('');
      onRefresh();
    } catch (error) {
      alert('Failed to update territory');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteTerritory(id);
      onRefresh();
    } catch (error) {
      alert('Failed to delete territory');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Territories</h2>
        <button
          onClick={() => { setEditing(null); setName(''); setAreaId(''); setOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Territory
        </button>
      </div>

      {open && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">{editing ? 'Edit' : 'Create'} Territory</h3>
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Territory name"
              className="w-full px-3 py-2 border rounded"
            />
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select area</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setOpen(false); setEditing(null); setName(''); setAreaId(''); }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {territories.map((territory) => (
          <div key={territory.id} className="flex justify-between items-center p-2 border rounded">
            <span>{territory.name} (Area: {areas.find(a => a.id === territory.areaId)?.name})</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(territory);
                  setName(territory.name);
                  setAreaId(territory.areaId.toString());
                  setOpen(true);
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(territory.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

