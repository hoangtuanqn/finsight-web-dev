import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const articles = [
  {
    title: '7 bước thoát khỏi nợ nần năm 2026',
    author: 'FinSight Team',
    date: '2026-04-20',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=1200&q=80',
    excerpt: 'Một lộ trình thực tế để kiểm kê khoản nợ, chọn thứ tự ưu tiên và giữ kỷ luật trả nợ trong nhiều tháng.',
    content: `Thoát khỏi nợ không bắt đầu bằng việc trả thật nhiều trong tháng đầu tiên. Nó bắt đầu bằng việc nhìn rõ toàn bộ bức tranh: bạn đang nợ ai, còn bao nhiêu, lãi suất thật sự là bao nhiêu và mỗi tháng dòng tiền có thể chịu được mức trả nào.

Bước 1: Lập danh sách toàn bộ khoản nợ. Ghi lại dư nợ hiện tại, số tiền gốc ban đầu, APR, phí phát sinh, ngày đến hạn và số tiền tối thiểu phải trả mỗi tháng. Nếu khoản vay có phí bảo hiểm hoặc phí quản lý, đừng bỏ qua vì chúng làm chi phí thật tăng lên.

Bước 2: Tính lại chi phí thật. APR quảng cáo chỉ là một phần câu chuyện. Với khoản trả góp, vay tiêu dùng hoặc thẻ tín dụng, EAR giúp bạn thấy chi phí thực tế hằng năm sau khi cộng lãi kép và các loại phí.

Bước 3: Chọn chiến lược. Avalanche ưu tiên khoản lãi cao nhất để tiết kiệm tiền lãi. Snowball ưu tiên khoản dư nợ nhỏ nhất để tạo động lực tâm lý. Không có chiến lược nào thắng tuyệt đối trong mọi tình huống, nhưng cần chọn một cách nhất quán.

Bước 4: Bảo vệ dòng tiền thiết yếu. Trước khi trả thêm, hãy giữ lại phần tiền cho sinh hoạt, nhà ở, đi lại và một khoản dự phòng nhỏ. Trả nợ quá căng trong một tháng rồi phải vay lại ở tháng sau sẽ làm kế hoạch gãy.

Bước 5: Tự động hóa ngày trả. Đặt lịch nhắc trước hạn thanh toán ít nhất 3 ngày. Với thẻ tín dụng, nên trả trước ngày sao kê hoặc ngày đến hạn tùy mục tiêu quản lý lãi và điểm tín dụng.

Bước 6: Dùng tiền trả thêm một cách có chủ đích. Khi một khoản nợ tất toán, đừng tiêu phần tiền vừa được giải phóng. Hãy chuyển nó sang khoản tiếp theo trong danh sách ưu tiên.

Bước 7: Rà soát mỗi tháng. Nếu thu nhập giảm, phí phát sinh hoặc có khoản nợ mới, hãy cập nhật kế hoạch ngay. Một kế hoạch trả nợ tốt là kế hoạch được điều chỉnh theo thực tế, không phải bảng tính cố định từ đầu năm.`,
    category: 'STORY',
  },
  {
    title: 'Câu chuyện thành công: từ nợ 500 triệu đến tự do tài chính',
    author: 'Nguyễn Văn B',
    date: '2026-04-15',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80',
    excerpt:
      'Hành trình 3 năm của một gia đình trẻ khi kết hợp Snowball, ngân sách sinh hoạt chặt chẽ và quỹ dự phòng.',
    content: `Năm đầu tiên, khoản nợ lớn nhất không phải là con số 500 triệu mà là cảm giác mất kiểm soát. Gia đình anh B có ba nhóm nợ: vay tiêu dùng, thẻ tín dụng và khoản vay mua xe. Mỗi khoản có ngày đến hạn khác nhau, khiến việc trả nợ giống như chạy theo lịch.

Thay vì cố trả đều tất cả, anh bắt đầu bằng Snowball. Khoản nhỏ nhất được xử lý trước để tạo cảm giác tiến bộ rõ ràng. Sau 4 tháng, hai khoản trả góp nhỏ được tất toán, giải phóng thêm hơn 3 triệu đồng mỗi tháng.

Điểm thay đổi quan trọng nằm ở ngân sách. Gia đình anh đặt trần chi tiêu cố định cho ăn uống, đi lại và mua sắm. Mỗi khoản thưởng hoặc thu nhập ngoài giờ được chia làm ba phần: 70% trả nợ, 20% dự phòng, 10% cho nhu cầu cá nhân để tránh kiệt sức tài chính.

Sang năm thứ hai, khi số khoản nợ còn lại ít hơn, anh chuyển sang Avalanche để xử lý khoản có lãi cao nhất. Tổng tiền lãi giảm đáng kể so với việc tiếp tục trả theo cảm tính.

Sau 36 tháng, gia đình anh không chỉ hết nợ tiêu dùng mà còn giữ được quỹ dự phòng 4 tháng chi phí sinh hoạt. Bài học lớn nhất là kế hoạch trả nợ không cần hoàn hảo từ đầu, nhưng phải đủ rõ để mỗi tháng biết chính xác tiền đi đâu.`,
    category: 'STORY',
  },
  {
    title: 'Lãi suất ngân hàng tháng 4/2026: biến động nhẹ',
    author: 'FinSight Research',
    date: '2026-04-10',
    imageUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1200&q=80',
    excerpt: 'Cách đọc mặt bằng lãi suất tiết kiệm và tác động của nó đến quyết định trả nợ sớm hay giữ tiền mặt.',
    content: `Khi lãi suất tiết kiệm thay đổi nhẹ, câu hỏi thường gặp là nên gửi tiết kiệm hay trả bớt nợ. Câu trả lời phụ thuộc vào chênh lệch giữa lãi suất nhận được sau thuế, mức lãi/phí của khoản nợ và nhu cầu dự phòng tiền mặt.

Nếu khoản nợ có EAR cao hơn rõ rệt so với lãi tiết kiệm, trả nợ sớm thường đem lại hiệu quả tài chính tốt hơn. Ví dụ, một khoản vay tiêu dùng có EAR 35%/năm gần như luôn đắt hơn nhiều so với lợi suất tiền gửi.

Ngược lại, nếu khoản vay có lãi thấp, kỳ hạn dài và không bị phạt trả trước, người dùng có thể cân nhắc giữ lại một phần tiền mặt để tránh phải vay lại khi phát sinh sự cố.

Nguyên tắc thực tế là không nên dùng toàn bộ tiền dự phòng để trả nợ. Một quỹ dự phòng tối thiểu từ 1 đến 3 tháng chi phí thiết yếu giúp kế hoạch trả nợ bền hơn, đặc biệt với người có thu nhập biến động.

Trong FinSight, quyết định này nên được nhìn cùng lúc qua ba chỉ số: EAR của từng khoản nợ, DTI hằng tháng và tổng vốn khả dụng. Khi ba chỉ số cùng được cập nhật, người dùng sẽ tránh được lựa chọn tưởng như tối ưu nhưng làm dòng tiền tháng sau bị căng.`,
    category: 'STORY',
  },
  {
    title: 'Bẫy trả góp 0%: khi chi phí thật nằm trong phí',
    author: 'Lê Hải',
    date: '2026-04-02',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&q=80',
    excerpt: 'Vì sao khoản vay 0% vẫn có thể đắt nếu cộng phí hồ sơ, phí quản lý, phí bảo hiểm và phí thu hộ.',
    content: `Trả góp 0% nghe rất hấp dẫn vì người mua không thấy chữ "lãi". Nhưng trong nhiều hợp đồng, chi phí được chuyển sang các loại phí khác: phí hồ sơ, phí bảo hiểm khoản vay, phí quản lý tài khoản hoặc phí thu hộ hằng tháng.

Ví dụ, một món hàng 24 triệu trả trong 12 tháng có vẻ chỉ cần 2 triệu mỗi tháng. Nhưng nếu có thêm phí quản lý 3%, bảo hiểm 5% và phí thu hộ mỗi kỳ, tổng tiền thực trả có thể cao hơn nhiều so với giá niêm yết.

Điểm nguy hiểm là người dùng thường so sánh APR bằng 0 với lãi vay thông thường, trong khi cần nhìn EAR hoặc tổng chi phí thực tế. EAR giúp quy đổi toàn bộ chi phí về một tỷ lệ năm, từ đó dễ so sánh giữa các sản phẩm vay khác nhau.

Trước khi ký hợp đồng trả góp, hãy hỏi ba câu: tổng tiền phải trả là bao nhiêu, có khoản phí nào bắt buộc không, và nếu tất toán sớm thì có bị phạt không. Nếu câu trả lời không rõ ràng, khoản vay đó cần được xem như có rủi ro chi phí ẩn.`,
    category: 'STORY',
  },
  {
    title: 'DTI cao ảnh hưởng gì đến khả năng vay mua nhà?',
    author: 'Minh Anh',
    date: '2026-03-28',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    excerpt: 'DTI không chỉ là một con số thống kê, mà là tín hiệu ngân hàng dùng để đánh giá sức chịu nợ hàng tháng.',
    content: `DTI là tỷ lệ giữa tổng nghĩa vụ trả nợ hằng tháng và thu nhập hằng tháng. Nếu thu nhập là 30 triệu và tổng trả nợ là 15 triệu, DTI đang ở mức 50%.

Khi xét vay mua nhà, ngân hàng thường quan tâm đến khả năng trả nợ ổn định trong nhiều năm. Một người có thu nhập cao nhưng DTI quá lớn vẫn có thể bị đánh giá rủi ro vì phần tiền còn lại cho sinh hoạt quá mỏng.

Để kéo DTI xuống, không nhất thiết phải xử lý khoản nợ lớn nhất trước. Đôi khi tất toán một khoản trả góp nhỏ nhưng có số tiền trả tháng cao sẽ làm DTI giảm nhanh hơn, giúp hồ sơ vay trở nên đẹp hơn trong ngắn hạn.

Người dùng nên phân biệt mục tiêu tiết kiệm lãi và mục tiêu cải thiện DTI. Avalanche có thể tối ưu tiền lãi, còn một kế hoạch riêng có thể ưu tiên khoản ảnh hưởng mạnh nhất đến dòng tiền tháng. Hai mục tiêu này khác nhau và nên được chọn theo bối cảnh.`,
    category: 'STORY',
  },
  {
    title: 'Khi nào nên chọn Avalanche, khi nào nên chọn Snowball?',
    author: 'FinSight Team',
    date: '2026-03-18',
    imageUrl: 'https://images.unsplash.com/photo-1554224154-26032fced8bd?w=1200&q=80',
    excerpt: 'Hai phương pháp trả nợ phổ biến phục vụ hai mục tiêu khác nhau: tối ưu chi phí và duy trì động lực.',
    content: `Avalanche sắp xếp khoản nợ theo lãi suất cao nhất trước. Nếu người dùng có kỷ luật tốt và muốn giảm tổng tiền lãi, đây thường là lựa chọn hợp lý. Mỗi đồng trả thêm được dồn vào khoản đắt nhất, giúp giảm tốc độ phát sinh lãi.

Snowball sắp xếp khoản nợ theo dư nợ nhỏ nhất trước. Phương pháp này không phải lúc nào cũng tiết kiệm lãi nhất, nhưng tạo cảm giác thắng nhanh. Khi một khoản nhỏ biến mất khỏi danh sách, người dùng có thêm động lực để tiếp tục.

Trong thực tế, nhiều người bắt đầu bằng Snowball trong vài tháng đầu để tạo đà, sau đó chuyển sang Avalanche khi danh sách nợ đã gọn hơn. Điều quan trọng là không trả theo cảm xúc từng tháng mà cần một thứ tự rõ ràng.

Nếu khoản nợ có kỳ hạn hợp đồng quá ngắn hoặc trả tối thiểu không đủ để tất toán đúng hạn, cả Avalanche và Snowball đều cần được xem cùng cảnh báo quá hạn. Khi đó, người dùng nên tăng ngân sách trả thêm hoặc lập kế hoạch riêng cho nhóm khoản nợ đang rủi ro.`,
    category: 'STORY',
  },
];

async function main() {
  await prisma.article.deleteMany();
  const result = await prisma.article.createMany({ data: articles });
  console.log(`Seeded ${result.count} articles.`);
}

main()
  .catch((error) => {
    console.error('Failed to seed articles:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
