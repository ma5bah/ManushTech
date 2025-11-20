import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import { adminService, type Retailer, type CreateRetailerData } from '@/services/admin';
import type { Region, Area, Distributor, Territory } from '@/services/admin';

function CSVImportModal({ onImported }: { onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sampleCsvData = `"name","phone","region","area","distributor","territory","points","routes","notes"
"Dhaka Central Store","01712345678","Dhaka","Gulshan","Unilever Bangladesh","Banani","120","Route 5","Frequent customer"
"Chittagong Emporium","01812345679","Chittagong","Agrabad","ACI Limited","Halishahar","250","Route 2","Large orders"
"Khulna Corner Shop","01912345680","Khulna","Khulna Sadar","Square Group","","80","Route 11","Pays on time"
"Rajshahi Traders","01512345681","Rajshahi","Boalia","Pran-RFL Group","","300","Route 8",""
"Sylhet Super Market","01612345682","Sylhet","Sylhet Sadar","Unilever Bangladesh","","150","Route 3","New customer"`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a CSV file',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await adminService.importRetailers(file);
      toast({
        title: 'Success',
        description: `Imported ${result.imported} retailer(s)${result.skipped > 0 ? `, skipped ${result.skipped} duplicate(s)` : ''}`,
      });
      setFile(null);
      onImported();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to import retailers',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Import Retailers from CSV</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-600 mt-2">
            CSV should contain: name, phone, region, area, distributor, territory (optional), points (optional), routes (optional), notes (optional)
          </p>
          <div className="mt-2">
            <Label>Sample CSV Content</Label>
            <textarea
              readOnly
              className="w-full h-32 p-2 mt-1 text-xs border rounded bg-gray-50 font-mono"
              value={sampleCsvData}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => navigator.clipboard.writeText(sampleCsvData)}
            >
              Copy Sample
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleImport} disabled={loading || !file}>
          {loading ? 'Importing...' : 'Import'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function RetailersTab({ regions, areas, distributors, territories }: { regions: Region[]; areas: Area[]; distributors: Distributor[]; territories: Territory[] }) {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Retailer | null>(null);
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
  const { toast } = useToast();

  useEffect(() => {
    loadRetailers();
  }, [page, search]);

  const loadRetailers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getRetailers(page, 20, search);
      setRetailers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load retailers',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await adminService.createRetailer(formData);
      toast({ title: 'Success', description: 'Retailer created' });
      setOpen(false);
      resetForm();
      loadRetailers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create retailer',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await adminService.updateRetailer(editing.id, formData);
      toast({ title: 'Success', description: 'Retailer updated' });
      setOpen(false);
      setEditing(null);
      resetForm();
      loadRetailers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update retailer',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteRetailer(id);
      toast({ title: 'Success', description: 'Retailer deleted' });
      loadRetailers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete retailer',
      });
    }
  };

  const resetForm = () => {
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
  };

  const filteredAreas = areas.filter(a => !formData.regionId || a.regionId === formData.regionId);
  const filteredTerritories = territories.filter(t => !formData.areaId || t.areaId === formData.areaId);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Retailers</CardTitle>
          <div className="flex gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Import from CSV</Button>
              </DialogTrigger>
              <CSVImportModal onImported={() => {
                setImportOpen(false);
                loadRetailers();
              }} />
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); resetForm(); }}>Add Retailer</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit' : 'Create'} Retailer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="regionId">Region *</Label>
                    <Select value={formData.regionId.toString()} onValueChange={(value) => {
                      setFormData({ ...formData, regionId: parseInt(value), areaId: 0, territoryId: undefined });
                    }}>
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
                  <div>
                    <Label htmlFor="areaId">Area *</Label>
                    <Select value={formData.areaId.toString()} onValueChange={(value) => {
                      setFormData({ ...formData, areaId: parseInt(value), territoryId: undefined });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAreas.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="distributorId">Distributor *</Label>
                    <Select value={formData.distributorId.toString()} onValueChange={(value) => {
                      setFormData({ ...formData, distributorId: parseInt(value) });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select distributor" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="territoryId">Territory</Label>
                    <Select value={formData.territoryId?.toString() || 'all'} onValueChange={(value) => {
                      setFormData({ ...formData, territoryId: value === 'all' ? undefined : parseInt(value) });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select territory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">None</SelectItem>
                        {filteredTerritories.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="routes">Routes</Label>
                    <Input
                      id="routes"
                      value={formData.routes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, routes: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
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
        </div>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search retailers..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
          className="mb-4"
        />
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-2">
            {retailers.map((retailer) => (
              <div key={retailer.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-semibold">{retailer.name}</span>
                  {retailer.phone && <span className="text-sm text-gray-600 ml-2">{retailer.phone}</span>}
                  <div className="text-sm text-gray-600">
                    {retailer.region.name} / {retailer.area.name} / {retailer.distributor.name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(retailer);
                      setFormData({
                        name: retailer.name,
                        phone: retailer.phone || '',
                        regionId: retailer.region.id,
                        areaId: retailer.area.id,
                        distributorId: retailer.distributor.id,
                        territoryId: retailer.territory?.id,
                        points: retailer.points,
                        routes: retailer.routes,
                        notes: retailer.notes,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(retailer.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
