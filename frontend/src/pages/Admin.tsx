import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/services/admin';
import type { Region, Area, Distributor, Territory } from '@/services/admin';
import { RetailersTab } from './AdminRetailers';
import { SalesRepsTab } from './AdminSalesReps';
import { BulkAssignTab } from './AdminBulkAssign';

export default function Admin() {
  const { logout } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);

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
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>

      <Tabs defaultValue="regions" className="w-full">
        <TabsList>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="distributors">Distributors</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="retailers">Retailers</TabsTrigger>
          <TabsTrigger value="salesReps">Sales Reps</TabsTrigger>
          <TabsTrigger value="assignments">Bulk Assign</TabsTrigger>
        </TabsList>

        <TabsContent value="regions">
          <RegionsTab regions={regions} onRefresh={loadAll} />
        </TabsContent>
        <TabsContent value="areas">
          <AreasTab areas={areas} regions={regions} onRefresh={loadAll} />
        </TabsContent>
        <TabsContent value="distributors">
          <DistributorsTab distributors={distributors} onRefresh={loadAll} />
        </TabsContent>
        <TabsContent value="territories">
          <TerritoriesTab territories={territories} areas={areas} onRefresh={loadAll} />
        </TabsContent>
        <TabsContent value="retailers">
          <RetailersTab regions={regions} areas={areas} distributors={distributors} territories={territories} />
        </TabsContent>
        <TabsContent value="salesReps">
          <SalesRepsTab />
        </TabsContent>
        <TabsContent value="assignments">
          <BulkAssignTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RegionsTab({ regions, onRefresh }: { regions: Region[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Region | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await adminService.createRegion(name);
      toast({ title: 'Success', description: 'Region created' });
      setOpen(false);
      setName('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create region',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateRegion(editing.id, name);
      toast({ title: 'Success', description: 'Region updated' });
      setOpen(false);
      setEditing(null);
      setName('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update region',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteRegion(id);
      toast({ title: 'Success', description: 'Region deleted' });
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete region',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Regions</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setName(''); }}>Add Region</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'Create'} Region</DialogTitle>
                <DialogDescription>
                  {editing ? 'Update' : 'Create'} a new region
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={editing ? handleUpdate : handleCreate}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {regions.map((region) => (
            <div key={region.id} className="flex justify-between items-center p-2 border rounded">
              <span>{region.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(region);
                    setName(region.name);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(region.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AreasTab({ areas, regions, onRefresh }: { areas: Area[]; regions: Region[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [regionId, setRegionId] = useState('');
  const [editing, setEditing] = useState<Area | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await adminService.createArea(name, parseInt(regionId));
      toast({ title: 'Success', description: 'Area created' });
      setOpen(false);
      setName('');
      setRegionId('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create area',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateArea(editing.id, name, parseInt(regionId));
      toast({ title: 'Success', description: 'Area updated' });
      setOpen(false);
      setEditing(null);
      setName('');
      setRegionId('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update area',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteArea(id);
      toast({ title: 'Success', description: 'Area deleted' });
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete area',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Areas</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setName(''); setRegionId(''); }}>Add Area</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'Create'} Area</DialogTitle>
                <DialogDescription>
                  {editing ? 'Update' : 'Create'} a new area
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select value={regionId} onValueChange={setRegionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={editing ? handleUpdate : handleCreate}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {areas.map((area) => (
            <div key={area.id} className="flex justify-between items-center p-2 border rounded">
              <span>{area.name} (Region: {regions.find(r => r.id === area.regionId)?.name})</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(area);
                    setName(area.name);
                    setRegionId(area.regionId.toString());
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(area.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DistributorsTab({ distributors, onRefresh }: { distributors: Distributor[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Distributor | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await adminService.createDistributor(name);
      toast({ title: 'Success', description: 'Distributor created' });
      setOpen(false);
      setName('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create distributor',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateDistributor(editing.id, name);
      toast({ title: 'Success', description: 'Distributor updated' });
      setOpen(false);
      setEditing(null);
      setName('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update distributor',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteDistributor(id);
      toast({ title: 'Success', description: 'Distributor deleted' });
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete distributor',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Distributors</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setName(''); }}>Add Distributor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'Create'} Distributor</DialogTitle>
                <DialogDescription>
                  {editing ? 'Update' : 'Create'} a new distributor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={editing ? handleUpdate : handleCreate}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {distributors.map((distributor) => (
            <div key={distributor.id} className="flex justify-between items-center p-2 border rounded">
              <span>{distributor.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(distributor);
                    setName(distributor.name);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(distributor.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TerritoriesTab({ territories, areas, onRefresh }: { territories: Territory[]; areas: Area[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [editing, setEditing] = useState<Territory | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await adminService.createTerritory(name, parseInt(areaId));
      toast({ title: 'Success', description: 'Territory created' });
      setOpen(false);
      setName('');
      setAreaId('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create territory',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateTerritory(editing.id, name, parseInt(areaId));
      toast({ title: 'Success', description: 'Territory updated' });
      setOpen(false);
      setEditing(null);
      setName('');
      setAreaId('');
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update territory',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteTerritory(id);
      toast({ title: 'Success', description: 'Territory deleted' });
      onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete territory',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Territories</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setName(''); setAreaId(''); }}>Add Territory</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'Create'} Territory</DialogTitle>
                <DialogDescription>
                  {editing ? 'Update' : 'Create'} a new territory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Area</Label>
                  <Select value={areaId} onValueChange={setAreaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={editing ? handleUpdate : handleCreate}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {territories.map((territory) => (
            <div key={territory.id} className="flex justify-between items-center p-2 border rounded">
              <span>{territory.name} (Area: {areas.find(a => a.id === territory.areaId)?.name})</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(territory);
                    setName(territory.name);
                    setAreaId(territory.areaId.toString());
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(territory.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

