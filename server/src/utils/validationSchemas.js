import { z } from 'zod';

export const authSchemas = {
  register: z.object({
    fullName: z.string()
      .min(1, 'Họ tên không được để trống')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(50, 'Họ tên không được vượt quá 50 ký tự'),
    email: z.string()
      .min(1, 'Email không được để trống')
      .email('Email không hợp lệ'),
    password: z.string()
      .min(1, 'Mật khẩu không được để trống')
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string()
      .min(1, 'Xác nhận mật khẩu là bắt buộc')
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  }),

  login: z.object({
    email: z.string()
      .min(1, 'Email không được để trống')
      .email('Email không hợp lệ'),
    password: z.string()
      .min(1, 'Mật khẩu không được để trống')
  })
};
