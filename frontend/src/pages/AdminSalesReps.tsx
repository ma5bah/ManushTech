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
import { useAuth } from '@/contexts/AuthContext';
import { usersService, type User, type CreateUserData } from '@/services/users';

export function SalesRepsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    username: '',
    password: '',
    role: 'SalesRep',
  });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getList();
      setUsers(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await usersService.create(formData);
      toast({ title: 'Success', description: 'User created' });
      setOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create user',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const updateData: Partial<CreateUserData> = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }
    try {
      await usersService.update(editing.id, updateData);
      toast({ title: 'Success', description: 'User updated' });
      setOpen(false);
      setEditing(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await usersService.delete(id);
      toast({ title: 'Success', description: 'User deleted' });
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete user',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      role: 'SalesRep',
    });
  };

  const isPredefinedAdmin = currentUser?.isPredefinedAdmin;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Sales Reps</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); }}>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'Create'} User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                {(!editing || formData.password) && (
                  <div>
                    <Label htmlFor="password">Password {editing ? '(leave empty to keep current)' : '*'} </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
                {isPredefinedAdmin && (
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SalesRep">SalesRep</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-semibold">{user.username}</span>
                  <span className="text-sm text-gray-600 ml-2">({user.email})</span>
                  <div className="text-sm text-gray-600">
                    Role: {user.role}
                    {user.salesRep && ` - ${user.salesRep.name}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(user);
                      setFormData({
                        email: user.email,
                        username: user.username,
                        password: '',
                        role: user.role,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

