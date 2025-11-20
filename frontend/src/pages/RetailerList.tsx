import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { retailersService } from '@/services/retailers';
import type { Retailer, RetailerQuery } from '@/services/retailers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/services/admin';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load retailers',
      });
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Retailers</h1>
        <Button onClick={logout} variant="outline">Logout</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, phone..."
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            />
            <Select onValueChange={(value: string) => handleFilter('regionId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value: string) => handleFilter('areaId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value: string) => handleFilter('distributorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Distributor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Distributors</SelectItem>
                {distributors.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value: string) => handleFilter('territoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Territories</SelectItem>
                {territories.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="grid gap-4">
            {retailers.map((retailer) => (
              <Card
                key={retailer.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/retailers/${retailer.id}`)}
              >
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setQuery({ ...query, page: page - 1 })}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setQuery({ ...query, page: page + 1 })}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

