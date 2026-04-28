import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';

export async function getArticles(req: Request, res: Response) {
  try {
    const articles = await (prisma as any).article.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return success(res, { articles });
  } catch (err) {
    console.error('getArticles error:', err);
    return error(res, 'Internal server error');
  }
}

export async function seedArticles(req: Request, res: Response) {
  try {
    const count = await (prisma as any).article.count();
    if (count > 0) {
      return success(res, { message: 'Articles already seeded', count });
    }

    const initialStories = [
      {
        title: "Hành trình thoát khỏi 'Ma trận' Thẻ tín dụng",
        author: "Hoàng Tuấn",
        date: "15 Tháng 4, 2026",
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
        excerpt: "Cầm 4 chiếc thẻ tín dụng trong tay, tôi từng nghĩ mình kiểm soát được tài chính. Cho đến khi tiền lương không đủ trả số dư tối thiểu...",
        content: "Tôi từng có 4 thẻ tín dụng với tổng hạn mức hơn 150 triệu. Ban đầu, tôi dùng bảng Excel để ghi chép ngày đến hạn và số dư tối thiểu. Tuy nhiên, việc tính toán thủ công khiến tôi thường xuyên quên ngày thanh toán, bị phạt trễ hạn (late fee) và tiền lãi cộng dồn. \n\nKhi tự tính tay, tôi chỉ nhìn vào lãi suất công bố (APR) là 24%/năm. Nhưng tôi không nhận ra rằng, với cơ chế tính lãi kép theo ngày của thẻ tín dụng, lãi suất thực tế (EAR) có thể lên tới gần 30%.\n\nSử dụng FinSight đã giúp tôi: \n1. Tự động tính toán EAR thật sự cho từng thẻ. \n2. So sánh và chọn phương pháp Avalanche (trả thẻ lãi cao nhất trước) thay vì trả rải rác mỗi thẻ một ít. \n3. Nhìn thấy viễn cảnh 'Nếu mỗi tháng tôi trả thêm 2 triệu, tôi sẽ hết nợ thẻ sau 14 tháng thay vì 3 năm'. FinSight thay đổi hoàn toàn cách tôi quản lý dòng tiền."
      },
      {
        title: "Áp lực DTI và Quyết định mua nhà",
        author: "Minh Anh",
        date: "10 Tháng 4, 2026",
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
        excerpt: "Ngân hàng từ chối hồ sơ vay mua nhà của tôi vì tỷ lệ DTI quá cao. Tôi đã phải lập kế hoạch để kéo DTI từ 55% xuống vùng an toàn 30%.",
        content: "Thu nhập 30 triệu/tháng, tôi đinh ninh mình có thể vay mua một căn chung cư trả góp. Tuy nhiên, khi nhân viên ngân hàng báo tỷ lệ DTI (Nợ/Thu nhập) của tôi đang ở mức 55% do tôi đang gánh 1 khoản vay mua xe và trả góp điện thoại, hồ sơ của tôi lập tức bị đánh rớt.\n\nNếu tự làm thủ công, tôi sẽ cố gắng 'cày' thêm thu nhập để bù vào. Nhưng thực tế, việc tất toán khoản vay nhỏ mới là chìa khóa.\n\nThông qua phân tích DTI trên phần mềm, tôi thấy khoản vay điện thoại dù nhỏ nhưng lại chiếm tới 15% DTI hàng tháng do kỳ hạn ngắn. Bằng phương pháp Snowball, tôi dồn tiền tất toán khoản vay điện thoại trong 2 tháng. DTI lập tức giảm xuống 40%, và sau khi thanh toán thêm một phần gốc vay xe, tôi đã đưa DTI về mức an toàn 30%. Ngôi nhà mơ ước cuối cùng cũng thuộc về tôi."
      },
      {
        title: "Bẫy lãi suất 0% và Cú sốc Phí ẩn",
        author: "Lê Hải",
        date: "02 Tháng 4, 2026",
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        excerpt: "Trông có vẻ như một món hời khi vay trả góp 0%, nhưng sự thật đằng sau các khoản phí quản lý và phí bảo hiểm lại là một câu chuyện khác.",
        content: "Khi mua một chiếc laptop mới, tôi được chào mời gói vay trả góp 12 tháng với 'lãi suất 0%'. Nghĩ rằng đây là cơ hội tốt, tôi lập tức đồng ý mà không đắn đo. Tôi nhẩm tính: Giá máy 24 triệu chia cho 12 tháng, mỗi tháng trả đúng 2 triệu. Rất đơn giản.\n\nNhưng khi hóa đơn tháng đầu tiên gửi về, số tiền phải trả lên tới 2.250.000đ. Tôi đã tự mình lấy Excel ra cộng trừ nhưng không hiểu khoản chênh lệch từ đâu ra.\n\nChỉ khi tôi nhập số liệu khoản vay này vào FinSight, bức tranh thực sự mới lộ diện: Mặc dù APR là 0%, nhưng tôi phải gánh thêm 'Phí thu hộ' (12.000đ/tháng), 'Phí quản lý tài khoản' (3% giá trị vay) và 'Bảo hiểm khoản vay' (5%). FinSight đã tính toán ra chỉ số EAR (Lãi suất thực tế thường niên) của khoản vay này lên tới hơn 18%!\n\nNhờ phân tích trực quan này, tôi mới vỡ lẽ rằng trên đời không có bữa ăn nào miễn phí. Khái niệm EAR đã giúp tôi sáng mắt và từ đó tôi cẩn trọng hơn hẳn trước những lời mời chào '0% lãi suất'."
      }
    ];

    const result = await (prisma as any).article.createMany({
      data: initialStories
    });

    return success(res, { message: 'Seeded articles successfully', count: result.count });
  } catch (err) {
    console.error('seedArticles error:', err);
    return error(res, 'Internal server error');
  }
}
