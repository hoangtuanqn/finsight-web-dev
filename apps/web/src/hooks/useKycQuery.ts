import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycAPI } from '../api';
import { toast } from 'sonner';

export function useKycStatus() {
  return useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const res = await kycAPI.getStatus();
      return res.data.data.kyc;
    },
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

export function useKycSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await kycAPI.submit(formData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.data.message || 'Xác minh danh tính thành công');
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Lỗi khi gửi thông tin xác minh. Vui lòng thử lại.';
      toast.error(msg);
    },
  });
}
