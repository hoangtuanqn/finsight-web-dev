import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Modal } from '@repo/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table';
import { useEffect, useState } from 'react';

interface Party {
  id: string;
  taxCode: string;
  name: string;
  internalCode: string;
  typeTags: string[];
  creditLimit: number;
  status: string;
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    taxCode: '',
    name: '',
    internalCode: '',
    typeTags: 'CUSTOMER',
    creditLimit: 0,
    isRelatedParty: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/v1/enterprise/parties');
      const data = await res.json();
      if (data.success) {
        setParties(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch parties', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5001/api/v1/enterprise/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          typeTags: formData.typeTags.split(',').map((t) => t.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create party');
      }

      setParties([data.data, ...parties]);
      setIsModalOpen(false);
      setFormData({
        taxCode: '',
        name: '',
        internalCode: '',
        typeTags: 'CUSTOMER',
        creditLimit: 0,
        isRelatedParty: false,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Đối Tác (Parties)</h1>
          <p className="text-slate-400 mt-1">Quản lý khách hàng, nhà cung cấp và ngân hàng.</p>
        </div>
        <Button
          appName="web-enterprise"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            + Thêm Đối Tác
          </span>
        </Button>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow>
              <TableHead>Mã Nội Bộ</TableHead>
              <TableHead>Tên Đối Tác</TableHead>
              <TableHead>MST</TableHead>
              <TableHead>Vai Trò</TableHead>
              <TableHead className="text-right">Hạn Mức Tín Dụng</TableHead>
              <TableHead>Trạng Thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Chưa có đối tác nào. Hãy tạo mới!
                </TableCell>
              </TableRow>
            ) : (
              parties.map((party) => (
                <TableRow key={party.id}>
                  <TableCell className="font-medium text-emerald-400">{party.internalCode}</TableCell>
                  <TableCell className="text-white">{party.name}</TableCell>
                  <TableCell className="text-slate-300">{party.taxCode || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {party.typeTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-800 text-xs rounded-md text-slate-300 border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(party.creditLimit)}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                      {party.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tạo Đối Tác Mới" className="w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Tên Đối Tác *</label>
            <Input
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Mã Nội Bộ *</label>
              <Input
                required
                placeholder="KH001"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                value={formData.internalCode}
                onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Mã Số Thuế</label>
              <Input
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Vai Trò (Cách nhau dấu phẩy)</label>
            <Input
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
              value={formData.typeTags}
              onChange={(e) => setFormData({ ...formData, typeTags: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Hạn Mức Tín Dụng</label>
            <Input
              type="number"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isRelated"
              checked={formData.isRelatedParty}
              onChange={(e) => setFormData({ ...formData, isRelatedParty: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="isRelated" className="text-sm text-slate-300">
              Là đối tác nội bộ (Related Party)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button appName="cancel" className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsModalOpen(false);
                }}
              >
                Hủy
              </span>
            </Button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Lưu Đối Tác
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
