import prisma from '../lib/prisma';

export class HealthScoreService {
  /**
   * Cập nhật điểm sức khoẻ (Health Score). Giới hạn trong khoảng 300 - 850.
   */
  static async updateScore(userId: string, changeAmount: number, reason: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) return null;

      let newScore = user.healthScore + changeAmount;

      // Giới hạn điểm chuẩn FICO: 300 - 850
      if (newScore < 300) newScore = 300;
      if (newScore > 850) newScore = 850;

      const actualChange = newScore - user.healthScore;

      if (actualChange === 0) {
        return user; // Không cần cập nhật nếu điểm đã đạt kịch trần/sàn
      }

      // Cập nhật điểm mới vào User
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { healthScore: newScore },
      });

      // Lưu vết lịch sử biến động điểm
      await tx.healthScoreHistory.create({
        data: {
          userId,
          changeAmount: actualChange,
          reason,
        },
      });

      return updatedUser;
    });
  }

  static async deductScore(userId: string, penalty: number, reason: string) {
    return this.updateScore(userId, -Math.abs(penalty), reason);
  }

  static async addScore(userId: string, points: number, reason: string) {
    return this.updateScore(userId, Math.abs(points), reason);
  }
}
