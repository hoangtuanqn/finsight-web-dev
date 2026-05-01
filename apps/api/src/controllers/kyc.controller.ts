import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { ocrIdCard, checkLiveness } from '../services/kyc.service';

export async function getKycStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      select: {
        kycStatus: true,
        kycName: true,
        kycIdNumber: true,
        kycVerifiedAt: true,
        kycRecord: {
          select: {
            status: true,
            rejectReason: true,
          }
        }
      }
    });

    if (!user) return error(res, 'User not found', 404);

    return success(res, { kyc: user });
  } catch (err) {
    console.error('[KYC] getKycStatus error:', err);
    return error(res, 'Internal server error');
  }
}

export async function submitKyc(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    
    // Check if already verified or pending
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { kycStatus: true }
    });

    if (!user) return error(res, 'User not found', 404);
    if (user.kycStatus === 'VERIFIED') return error(res, 'Tài khoản đã xác minh eKYC', 400);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files?.front?.[0] || !files?.back?.[0] || !files?.video?.[0]) {
      return error(res, 'Vui lòng cung cấp đầy đủ ảnh mặt trước, mặt sau và video xác thực', 400);
    }

    const frontBuffer = files.front[0].buffer;
    const backBuffer = files.back[0].buffer;
    const videoBuffer = files.video[0].buffer;

    // 1. OCR Front
    const frontRes = await ocrIdCard(frontBuffer, 'front');
    console.log('\n--- [KYC] FPT.AI OCR Front Response ---');
    console.dir(frontRes, { depth: null });
    
    if (frontRes.errorCode !== 0 || !frontRes.data || frontRes.data.length === 0) {
      return error(res, `Ảnh mặt trước không hợp lệ: ${frontRes.errorMessage || 'Không nhận diện được'}`, 400, 'front');
    }
    const frontData = frontRes.data[0];

    // 2. OCR Back
    const backRes = await ocrIdCard(backBuffer, 'back');
    console.log('\n--- [KYC] FPT.AI OCR Back Response ---');
    console.dir(backRes, { depth: null });
    
    if (backRes.errorCode !== 0 || !backRes.data || backRes.data.length === 0) {
      return error(res, `Ảnh mặt sau không hợp lệ: ${backRes.errorMessage || 'Không nhận diện được'}`, 400, 'back');
    }
    const backData = backRes.data[0];

    // 3. Match ID numbers
    const frontId = frontData.id;
    const backId = backData.mrz_details?.id;
    
    if (!frontId) {
       return error(res, 'Không đọc được số CCCD mặt trước', 400, 'front');
    }
    
    if (backId && frontId !== backId) {
      return error(res, 'Số CCCD mặt trước và mặt sau không khớp', 400, 'back');
    }

    // 4. Liveness Check
    const livenessRes = await checkLiveness(videoBuffer, frontBuffer);
    console.log('\n--- [KYC] FPT.AI Liveness Response ---');
    console.dir(livenessRes, { depth: null });
    
    if (String(livenessRes.code) !== "200") {
       return error(res, `Lỗi xác thực video: ${livenessRes.message} (Code: ${livenessRes.code})`, 400, 'video');
    }

    const isLive = String(livenessRes.liveness?.is_live) === "true";
    const isMatch = String(livenessRes.face_match?.isMatch) === "true";
    const similarity = livenessRes.face_match?.similarity;
    
    let kycStatus = 'REJECTED';
    let rejectReason = '';
    
    if (!isLive) {
      rejectReason = 'Không vượt qua kiểm tra người thật (Liveness failed).';
    } else if (!isMatch) {
      rejectReason = 'Khuôn mặt trong video không khớp với CCCD.';
    } else {
      kycStatus = 'VERIFIED';
    }

    // 5. Save KycRecord
    const kycRecord = await (prisma as any).kycRecord.upsert({
      where: { userId },
      update: {
        idNumber: frontId,
        fullName: frontData.name?.toUpperCase(),
        dob: frontData.dob,
        sex: frontData.sex,
        address: frontData.address,
        issueDate: backData.issue_date || backData.mrz_details?.issue_date || '',
        issueLoc: backData.issue_loc || '',
        fptFrontRaw: frontData,
        fptBackRaw: backData,
        livenessRaw: livenessRes,
        isLive,
        faceMatchScore: String(similarity),
        status: kycStatus,
        rejectReason: rejectReason || null,
      },
      create: {
        userId,
        idNumber: frontId,
        fullName: frontData.name?.toUpperCase() || '',
        dob: frontData.dob || '',
        sex: frontData.sex || '',
        address: frontData.address || '',
        issueDate: backData.issue_date || backData.mrz_details?.issue_date || '',
        issueLoc: backData.issue_loc || '',
        fptFrontRaw: frontData,
        fptBackRaw: backData,
        livenessRaw: livenessRes,
        isLive,
        faceMatchScore: String(similarity),
        status: kycStatus,
        rejectReason: rejectReason || null,
      }
    });

    // Update User
    if (kycStatus === 'VERIFIED') {
      await (prisma as any).user.update({
        where: { id: userId },
        data: {
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
          kycName: frontData.name?.toUpperCase(),
          kycIdNumber: frontId,
        }
      });
      
      return success(res, { message: 'Xác minh eKYC thành công', status: 'VERIFIED' });
    } else {
      await (prisma as any).user.update({
        where: { id: userId },
        data: { kycStatus: 'REJECTED' }
      });
      return error(res, `Xác minh thất bại: ${rejectReason}`, 400, 'video');
    }

  } catch (err: any) {
    const apiError = err?.response?.data;
    console.error('[KYC] submitKyc error:', apiError || err.message || err);
    
    if (apiError && apiError.errorMessage) {
      return error(res, `Lỗi xác thực ảnh: ${apiError.errorMessage}`, 400, 'front');
    }
    if (apiError && apiError.message) {
      return error(res, `Lỗi xác thực video: ${apiError.message}`, 400, 'video');
    }

    return error(res, 'Lỗi hệ thống khi xử lý eKYC. Vui lòng thử lại sau.');
  }
}
