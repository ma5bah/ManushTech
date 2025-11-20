import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/admin';
import type { SalesRep } from '@/services/admin';
import type { BulkAssignData } from '@/services/admin';

export function BulkAssignTab() {
  const [retailers, setRetailers] = useState<{
    id: number;
    name: string;
    salesRepId: number | null;
  }[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedRetailers, setSelectedRetailers] = useState<Set<number>>(new Set());
  const [selectedSalesRep, setSelectedSalesRep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [retailersData, salesRepsData] = await Promise.all([
        adminService.getRetailersForAssignment(),
        adminService.getSalesReps(),
      ]);

      setRetailers(retailersData.map(r => ({ 
        id: r.id,
        name: r.name,
        salesRepId: r.salesRep?.id || null
      })));
      setSalesReps(salesRepsData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetailerSelect = (retailerId: number, isChecked: boolean) => {
    setSelectedRetailers((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(retailerId);
      } else {
        newSet.delete(retailerId);
      }
      return newSet;
    });
  };

  const handleAssign = async () => {
    if (selectedRetailers.size === 0 || selectedSalesRep === null) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select retailers and a sales representative.',
      });
      return;
    }

    setLoading(true);
    try {
      const data: BulkAssignData = {
        retailerIds: Array.from(selectedRetailers),
        salesRepId: selectedSalesRep,
        action: 'assign'
      };
      await adminService.bulkAssignRetailers(data);
      toast({ title: 'Success', description: 'Retailers assigned successfully.' });
      setSelectedRetailers(new Set());
      setSelectedSalesRep(null);
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign retailers',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (selectedRetailers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select retailers to unassign.',
      });
      return;
    }

    setLoading(true);
    try {
      const data: BulkAssignData = {
        retailerIds: Array.from(selectedRetailers),
        salesRepId: null,
        action: 'unassign'
      };
      // If unassigning, we need a salesRepId in the backend DTO?
      // Backend DTO expects salesRepId. For unassign, it deletes where salesRepId AND retailerId match.
      // The current UI allows selecting multiple retailers which might belong to DIFFERENT sales reps.
      // The backend bulkAssign implementation:
      // if (action === 'assign') ...
      // else { deleteMany({ where: { salesRepId, retailerId: { in: retailerIds } } }) }
      // This means unassign requires a specific salesRepId.
      // But here we are selecting retailers generally.
      
      // Constraint: We can only unassign from a specific SR if we know who they are assigned to.
      // For simplicity, we might need to ask the user to select the SR they are unassigning from, 
      // OR iterating if we support multi-SR unassignment (complex).
      
      // Let's check if selected retailers have the SAME salesRepId or require user to select SR for unassign too.
      // The backend requires salesRepId for unassign.
      
      if (selectedSalesRep === null) {
           toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select the Sales Rep to unassign from.',
          });
          return;
      }

      // We need to pass the salesRepId to the backend even for unassign
      data.salesRepId = selectedSalesRep;
      
      await adminService.bulkAssignRetailers(data);
      toast({ title: 'Success', description: 'Retailers unassigned successfully.' });
      setSelectedRetailers(new Set());
      setSelectedSalesRep(null);
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to unassign retailers',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Assign Retailers to Sales Reps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Available Retailers</h3>
              <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto space-y-2">
                {retailers.length === 0 ? (
                  <p>No retailers found.</p>
                ) : (
                  retailers.map((retailer) => (
                    <div key={retailer.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`retailer-${retailer.id}`}
                        checked={selectedRetailers.has(retailer.id)}
                        onChange={(e) => handleRetailerSelect(retailer.id, e.target.checked)}
                        className="h-4 w-4 text-primary rounded"
                      />
                      <Label htmlFor={`retailer-${retailer.id}`}>
                        {retailer.name} {retailer.salesRepId && `(Assigned to SR ID: ${retailer.salesRepId})`}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Assign Sales Representative</h3>
              <p className="text-sm text-muted-foreground mb-2">Select a Sales Rep to assign TO or unassign FROM.</p>
              <Select
                value={selectedSalesRep?.toString() || ''}
                onValueChange={(value) => setSelectedSalesRep(parseInt(value))}
              >
                <SelectTrigger className="w-full mb-2">
                  <SelectValue placeholder="Select Sales Rep" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id.toString()}>
                      {sr.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAssign} disabled={selectedRetailers.size === 0 || selectedSalesRep === null}>
                  Assign Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUnassign}
                  disabled={selectedRetailers.size === 0 || selectedSalesRep === null}
                >
                  Unassign Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
