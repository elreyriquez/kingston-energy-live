import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useGetReports, useCreateReport, useUpdateReport, Report } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Select, Textarea, Label } from '@/components/ui/all';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileText, Plus, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Reports() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const { data, isLoading } = useGetReports();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateReport();
  const [resolveError, setResolveError] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, status: string) => {
    setResolveError(null);
    updateMutation.mutate(
      { reportId: id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
        },
        onError: (err: any) => {
          setResolveError(err?.message || 'Failed to update report status. Please try again.');
        }
      }
    );
  };

  const statusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'in-review': return 'secondary';
      case 'resolved': return 'success';
      case 'dismissed': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Incident Reports</h1>
            <p className="text-muted-foreground">Manage resident submissions and operational issues.</p>
          </div>
          {user?.role === 'user' && (
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="w-4 h-4 mr-2" /> New Report
            </Button>
          )}
        </div>

        {resolveError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {resolveError}
          </div>
        )}

        {isCreating && user?.role === 'user' && (
          <CreateReportForm onSuccess={() => setIsCreating(false)} />
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">Ref ID</th>
                    <th className="px-6 py-4 font-bold">Zone / Location</th>
                    <th className="px-6 py-4 font-bold">Issue Type</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    {(user?.role === 'admin' || user?.role === 'manager') && <th className="px-6 py-4 font-bold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center p-8">Loading reports...</td></tr>
                  ) : data?.reports.map((r: Report) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{r.report_ref}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{r.zone_name}</div>
                        <div className="text-muted-foreground text-xs">{r.street}</div>
                      </td>
                      <td className="px-6 py-4 uppercase text-xs tracking-wider">{r.issue_type.replace('-', ' ')}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(r.submitted_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColor(r.status) as any}>{r.status}</Badge>
                      </td>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <td className="px-6 py-4">
                          {r.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                disabled={updateMutation.isPending}
                                onClick={() => handleUpdateStatus(r.id.toString(), 'resolved')}
                              >
                                <Check className="w-3 h-3 mr-1" /> Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                disabled={updateMutation.isPending}
                                onClick={() => handleUpdateStatus(r.id.toString(), 'dismissed')}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {!isLoading && data?.reports.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No reports found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function CreateReportForm({ onSuccess }: { onSuccess: () => void }) {
  const createMut = useCreateReport();
  const queryClient = useQueryClient();
  const [zone, setZone] = useState('Downtown Kingston');
  const [issueType, setIssueType] = useState('missed-pickup');
  const [street, setStreet] = useState('');
  const [desc, setDesc] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!street.trim()) {
      setSubmitError('Please enter a street address.');
      return;
    }

    createMut.mutate({
      data: {
        zone_name: zone,
        street: street.trim(),
        issue_type: issueType,
        priority: 'medium',
        description: desc || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
        onSuccess();
      },
      onError: (err: any) => {
        setSubmitError(err?.message || 'Failed to submit report. Please try again.');
      }
    });
  };

  return (
    <Card className="border-primary/50 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Submit New Report</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={zone} onChange={e => setZone(e.target.value)} required>
                <option value="Downtown Kingston">Downtown Kingston</option>
                <option value="Half Way Tree">Half Way Tree</option>
                <option value="Cross Roads">Cross Roads</option>
                <option value="Constant Spring">Constant Spring</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={street}
                onChange={e => setStreet(e.target.value)}
                required
                placeholder="e.g. 123 Hope Road"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Issue Type</Label>
            <Select value={issueType} onChange={e => setIssueType(e.target.value)} required>
              <option value="missed-pickup">Missed Pickup</option>
              <option value="overflowing">Overflowing Bins</option>
              <option value="illegal-dumping">Illegal Dumping</option>
              <option value="damaged-bin">Damaged Public Bin</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Additional details..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onSuccess}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
