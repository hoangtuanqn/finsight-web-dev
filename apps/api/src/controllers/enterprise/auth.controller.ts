import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import enterpriseDb from '../../prisma/enterprise.client';

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      taxCode,
      name,
      shortName,
      businessType,
      headquartersAddress,
      fullName,
      roleTitle,
      phoneNumber,
    } = req.body;

    if (!email || !password || !taxCode || !name || !businessType || !fullName || !roleTitle || !phoneNumber) {
      res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      return;
    }

    const existingUser = await enterpriseDb.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email đã tồn tại' });
      return;
    }

    const existingOrg = await enterpriseDb.organization.findUnique({ where: { taxCode } });
    if (existingOrg) {
      res.status(400).json({ error: 'Mã số doanh nghiệp đã tồn tại' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await enterpriseDb.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          taxCode,
          name,
          shortName,
          businessType,
          headquartersAddress,
        },
      });

      return await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          roleTitle,
          phoneNumber,
          organizationId: org.id,
        },
      });
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, organizationId: user.organizationId, role: 'enterprise' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' },
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          organizationId: user.organizationId,
        },
      },
    });
  } catch (error: any) {
    console.error('Enterprise Register Error:', error);
    res.status(500).json({ error: error.message });
  }
};
