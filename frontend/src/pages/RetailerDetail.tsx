import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { retailersService } from '@/services/retailers';
import type { Retailer, UpdateRetailerData } from '@/services/retailers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function RetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load retailer',
      });
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
      toast({
        title: 'Success',
        description: 'Retailer updated successfully',
      });
      loadRetailer();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update retailer',
      });
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
          <Button variant="outline" onClick={() => navigate('/retailers')}>
            Back to List
          </Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Retailer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm font-medium">{retailer.name}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p className="text-sm font-medium">{retailer.phone || 'N/A'}</p>
            </div>
            <div>
              <Label>Region</Label>
              <p className="text-sm font-medium">{retailer.region.name}</p>
            </div>
            <div>
              <Label>Area</Label>
              <p className="text-sm font-medium">{retailer.area.name}</p>
            </div>
            <div>
              <Label>Distributor</Label>
              <p className="text-sm font-medium">{retailer.distributor.name}</p>
            </div>
            {retailer.territory && (
              <div>
                <Label>Territory</Label>
                <p className="text-sm font-medium">{retailer.territory.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

