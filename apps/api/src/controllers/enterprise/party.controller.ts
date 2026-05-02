import { Request, Response } from 'express';
import enterpriseDb from '../../prisma/enterprise.client';

export const createParty = async (req: Request, res: Response) => {
  try {
    const { taxCode, name, shortName, internalCode, typeTags, creditLimit, isRelatedParty } = req.body;

    if (taxCode) {
      const existing = await enterpriseDb.party.findUnique({ where: { taxCode } });
      if (existing) {
        res.status(400).json({ error: 'Mã số thuế đã tồn tại trong hệ thống' });
        return;
      }
    }

    const party = await enterpriseDb.party.create({
      data: {
        taxCode,
        name,
        shortName,
        internalCode,
        typeTags,
        creditLimit,
        isRelatedParty,
      },
    });

    res.status(201).json({ success: true, data: party });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getParties = async (req: Request, res: Response) => {
  try {
    const parties = await enterpriseDb.party.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: parties });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const party = await enterpriseDb.party.update({
      where: { id },
      data: updateData,
    });
    res.status(200).json({ success: true, data: party });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
