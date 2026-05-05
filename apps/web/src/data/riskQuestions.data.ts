export interface RiskOption {
  text: string;
  score: number; // 0-100
}

export interface RiskQuestion {
  id: string;
  category: string;
  categoryKey: string;
  weight: number;
  question: string;
  options: RiskOption[];
}

export const QUESTION_POOL: RiskQuestion[] = [
  // ─────────────────────────────────────────────
  // PILLAR 1: TIME_HORIZON — Thời gian đầu tư (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'th_1',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Bạn dự định duy trì khoản đầu tư này trong bao lâu trước khi cần rút vốn?',
    options: [
      { text: 'Dưới 1 năm', score: 10 },
      { text: '1 – 3 năm', score: 35 },
      { text: '3 – 7 năm', score: 65 },
      { text: 'Trên 7 năm', score: 90 },
    ],
  },
  {
    id: 'th_2',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Bạn có kế hoạch lớn nào cần dùng số tiền này trong 2 năm tới không (mua nhà, kết hôn, trả nợ...)?',
    options: [
      { text: 'Chắc chắn có', score: 10 },
      { text: 'Có thể có, chưa quyết định', score: 35 },
      { text: 'Rất ít khả năng', score: 65 },
      { text: 'Không, khoản này dành hoàn toàn cho dài hạn', score: 90 },
    ],
  },
  {
    id: 'th_3',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Độ tuổi hiện tại của bạn?',
    options: [
      { text: 'Trên 55 tuổi (Gần/đã hưu)', score: 15 },
      { text: '45 – 55 tuổi', score: 35 },
      { text: '30 – 44 tuổi', score: 65 },
      { text: 'Dưới 30 tuổi (Nhiều thời gian)', score: 90 },
    ],
  },
  {
    id: 'th_4',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Đích đến thời gian cuối cùng của việc đầu tư này là gì?',
    options: [
      { text: 'Để có tiền đi du lịch/mua sắm năm sau', score: 10 },
      { text: 'Chuẩn bị cho con cái học đại học (5-10 năm tới)', score: 40 },
      { text: 'Chuẩn bị cho tuổi hưu', score: 70 },
      { text: 'Xây dựng tài sản để lại cho thế hệ sau', score: 90 },
    ],
  },
  {
    id: 'th_5',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Nếu thị trường suy thoái mạnh, bạn có thể kiên nhẫn chờ phục hồi trong bao lâu?',
    options: [
      { text: 'Không thể chờ, tôi cần tiền mặt ngay', score: 10 },
      { text: 'Chờ tối đa 6 - 12 tháng', score: 30 },
      { text: 'Chờ 1 - 3 năm', score: 60 },
      { text: 'Chờ hơn 3 năm, tôi không vội', score: 90 },
    ],
  },
  {
    id: 'th_6',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Bạn đánh giá thế nào về sự nghiệp và độ tuổi lao động của mình?',
    options: [
      { text: 'Sắp nghỉ hưu hoặc đã nghỉ', score: 10 },
      { text: 'Giai đoạn đỉnh cao nhưng sắp chững lại', score: 35 },
      { text: 'Đang phát triển mạnh, còn làm việc lâu dài', score: 70 },
      { text: 'Mới bắt đầu sự nghiệp, còn rất nhiều thời gian', score: 90 },
    ],
  },
  {
    id: 'th_7',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Nếu có một cơ hội đầu tư bị khóa vốn (lock) trong 5 năm, bạn nghĩ sao?',
    options: [
      { text: 'Tuyệt đối từ chối', score: 10 },
      { text: 'Chỉ tham gia với số vốn rất nhỏ', score: 35 },
      { text: 'Sẵn sàng cân nhắc nếu lợi nhuận hấp dẫn', score: 65 },
      { text: 'Hoàn toàn thoải mái vì tôi đầu tư dài hạn', score: 90 },
    ],
  },
  {
    id: 'th_8',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Sự thay đổi về hoàn cảnh sống (có con, chuyển nhà...) dự kiến diễn ra khi nào?',
    options: [
      { text: 'Đang diễn ra hoặc trong năm nay', score: 15 },
      { text: 'Trong vòng 1-2 năm tới', score: 35 },
      { text: 'Khoảng 3-5 năm nữa', score: 65 },
      { text: 'Hiện tại cuộc sống đã hoàn toàn ổn định', score: 90 },
    ],
  },
  {
    id: 'th_9',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Khi mua một tài sản, bạn thường mong đợi thấy lãi sau thời gian bao lâu?',
    options: [
      { text: 'Ngay trong tuần/tháng đầu tiên', score: 10 },
      { text: 'Sau khoảng 6 tháng đến 1 năm', score: 35 },
      { text: '2-3 năm cũng được', score: 65 },
      { text: '5-10 năm mới là đầu tư thực sự', score: 90 },
    ],
  },
  {
    id: 'th_10',
    category: 'Thời gian',
    categoryKey: 'TIME_HORIZON',
    weight: 1.5,
    question: 'Khoản đầu tư này chiếm tỷ trọng bao nhiêu trong tổng số tiền bạn dùng cho các kế hoạch ngắn hạn?',
    options: [
      { text: 'Chiếm gần như toàn bộ (rất rủi ro nếu bị kẹt vốn)', score: 10 },
      { text: 'Chiếm một nửa', score: 35 },
      { text: 'Chiếm phần nhỏ', score: 65 },
      { text: 'Không liên quan, đây là dòng tiền hoàn toàn độc lập', score: 90 },
    ],
  },

  // ─────────────────────────────────────────────
  // PILLAR 2: EXPERIENCE — Kinh nghiệm (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'ex_1',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Kinh nghiệm thực chiến đầu tư tài chính của bạn?',
    options: [
      { text: 'Chưa từng đầu tư', score: 10 },
      { text: 'Chỉ gửi tiết kiệm', score: 30 },
      { text: 'Đã đầu tư chứng khoán/vàng/quỹ', score: 65 },
      { text: 'Đầu tư đa dạng lớp tài sản (CK, Crypto, BĐS...)', score: 90 },
    ],
  },
  {
    id: 'ex_2',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Bạn thường ra quyết định đầu tư dựa trên điều gì?',
    options: [
      { text: 'Nghe bạn bè, người thân mách bảo', score: 10 },
      { text: 'Nghe tư vấn viên hoặc xem tin tức mạng', score: 30 },
      { text: 'Có tham khảo nhưng tự đưa ra quyết định', score: 65 },
      { text: 'Tự nghiên cứu báo cáo và phân tích độc lập', score: 90 },
    ],
  },
  {
    id: 'ex_3',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Bạn đã trải qua giai đoạn khủng hoảng kinh tế nào chưa (VD: Covid 2020)?',
    options: [
      { text: 'Chưa trải qua', score: 15 },
      { text: 'Đã trải qua nhưng lúc đó chưa đầu tư', score: 35 },
      { text: 'Trải qua và bị thua lỗ nặng', score: 60 },
      { text: 'Trải qua, quản trị vốn tốt và kiếm được tiền', score: 90 },
    ],
  },
  {
    id: 'ex_4',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Số năm kinh nghiệm đầu tư của bạn là bao nhiêu?',
    options: [
      { text: 'Dưới 1 năm', score: 15 },
      { text: '1 - 3 năm', score: 40 },
      { text: '3 - 5 năm', score: 65 },
      { text: 'Trên 5 năm', score: 90 },
    ],
  },
  {
    id: 'ex_5',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Bạn đã bao giờ sử dụng đòn bẩy tài chính (Margin / Vay nợ) để đầu tư chưa?',
    options: [
      { text: 'Chưa bao giờ, thấy rất sợ', score: 20 },
      { text: 'Chưa, nhưng muốn tìm hiểu', score: 40 },
      { text: 'Đã từng dùng vài lần', score: 65 },
      { text: 'Thường xuyên sử dụng và quản trị tốt', score: 90 },
    ],
  },
  {
    id: 'ex_6',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Số lượng lớp tài sản bạn từng sở hữu cùng một lúc?',
    options: [
      { text: '1 loại (chỉ Tiết kiệm hoặc chỉ Vàng)', score: 15 },
      { text: '2 loại', score: 40 },
      { text: '3-4 loại', score: 70 },
      { text: 'Nhiều hơn 4 loại', score: 90 },
    ],
  },
  {
    id: 'ex_7',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Bạn đã từng tái cân bằng (rebalance) danh mục đầu tư bao giờ chưa?',
    options: [
      { text: 'Chưa nghe đến từ này', score: 10 },
      { text: 'Biết khái niệm nhưng chưa từng làm', score: 35 },
      { text: 'Thi thoảng có điều chỉnh lại', score: 65 },
      { text: 'Làm định kỳ mỗi quý/năm rất kỷ luật', score: 90 },
    ],
  },
  {
    id: 'ex_8',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Sự hiểu biết của bạn về phân tích kỹ thuật và phân tích cơ bản?',
    options: [
      { text: 'Không biết gì', score: 10 },
      { text: 'Chỉ biết một vài khái niệm sơ sài', score: 35 },
      { text: 'Sử dụng thành thạo 1 trong 2', score: 70 },
      { text: 'Kết hợp nhịp nhàng cả hai phương pháp', score: 90 },
    ],
  },
  {
    id: 'ex_9',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Bạn học kiến thức tài chính từ nguồn nào?',
    options: [
      { text: 'Không chủ động học', score: 10 },
      { text: 'Mạng xã hội (TikTok, Facebook, tin đồn)', score: 30 },
      { text: 'Sách, báo chí chuyên ngành', score: 65 },
      { text: 'Học thuật, chứng chỉ chuyên nghiệp', score: 90 },
    ],
  },
  {
    id: 'ex_10',
    category: 'Kinh nghiệm',
    categoryKey: 'EXPERIENCE',
    weight: 1.2,
    question: 'Mức độ tự tin của bạn khi tự xây dựng danh mục đầu tư?',
    options: [
      { text: 'Hoàn toàn không tự tin, cần người làm hộ', score: 10 },
      { text: 'Tự tin một chút, nhưng cần tư vấn thêm', score: 40 },
      { text: 'Khá tự tin', score: 70 },
      { text: 'Rất tự tin, tôi kiểm soát được mọi rủi ro', score: 90 },
    ],
  },

  // ─────────────────────────────────────────────
  // PILLAR 3: CAPACITY — Khả năng tài chính (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'ca_1',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Tổng tài sản của bạn (không tính nhà đang ở) so với thu nhập hàng năm?',
    options: [
      { text: 'Gần như không có tích lũy', score: 10 },
      { text: 'Tương đương 1-2 năm thu nhập', score: 35 },
      { text: 'Tương đương 3-5 năm thu nhập', score: 65 },
      { text: 'Lớn hơn 5 năm thu nhập', score: 90 },
    ],
  },
  {
    id: 'ca_2',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Tình trạng nợ hiện tại của bạn?',
    options: [
      { text: 'Đang có nợ xấu, nợ lãi suất cao', score: 10 },
      { text: 'Nợ tiêu dùng/trả góp khá nhiều', score: 35 },
      { text: 'Chỉ có nợ thế chấp (mua nhà) lãi ổn định', score: 65 },
      { text: 'Hoàn toàn không có nợ', score: 90 },
    ],
  },
  {
    id: 'ca_3',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Bạn có nguồn thu nhập thụ động (tiền thuê nhà, cổ tức...) không?',
    options: [
      { text: 'Không có', score: 15 },
      { text: 'Có nhưng rất ít', score: 35 },
      { text: 'Có, đủ trả một phần chi phí sinh hoạt', score: 65 },
      { text: 'Có, hoàn toàn đủ trang trải cuộc sống', score: 90 },
    ],
  },
  {
    id: 'ca_4',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Thu nhập hàng tháng của bạn có ổn định không?',
    options: [
      { text: 'Rất bấp bênh, tháng có tháng không', score: 15 },
      { text: 'Tương đối, phụ thuộc nhiều vào hoa hồng/dự án', score: 35 },
      { text: 'Ổn định từ lương cố định', score: 65 },
      { text: 'Rất ổn định và có dư dả hàng tháng', score: 90 },
    ],
  },
  {
    id: 'ca_5',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Tỉ lệ tiền dư ra hàng tháng sau khi trừ đi chi phí sinh hoạt và trả nợ?',
    options: [
      { text: 'Dưới 10% hoặc âm', score: 10 },
      { text: 'Từ 10% - 20%', score: 35 },
      { text: 'Từ 20% - 40%', score: 65 },
      { text: 'Trên 40%', score: 90 },
    ],
  },
  {
    id: 'ca_6',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Nếu khoản đầu tư này mất trắng, cuộc sống của bạn sẽ thế nào?',
    options: [
      { text: 'Khủng hoảng, phá sản', score: 5 },
      { text: 'Phải thắt lưng buộc bụng nhiều năm', score: 30 },
      { text: 'Buồn, nhưng cuộc sống vẫn bình thường', score: 65 },
      { text: 'Không hề hấn gì, đây chỉ là vốn nhàn rỗi', score: 90 },
    ],
  },
  {
    id: 'ca_7',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Tỉ lệ nợ trên thu nhập (DTI) của bạn là khoảng bao nhiêu?',
    options: [
      { text: 'Trên 50%', score: 10 },
      { text: 'Khoảng 30% - 50%', score: 35 },
      { text: 'Dưới 30%', score: 65 },
      { text: '0%', score: 90 },
    ],
  },
  {
    id: 'ca_8',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Chi tiêu thiết yếu (nhà ở, ăn uống) chiếm bao nhiêu % thu nhập của bạn?',
    options: [
      { text: 'Trên 70%', score: 15 },
      { text: '50% - 70%', score: 40 },
      { text: '30% - 50%', score: 65 },
      { text: 'Dưới 30%', score: 90 },
    ],
  },
  {
    id: 'ca_9',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Khả năng gia tăng thu nhập trong tương lai của bạn?',
    options: [
      { text: 'Có thể giảm sút (gần hưu, ngành nghề khó khăn)', score: 15 },
      { text: 'Chỉ tăng theo lạm phát', score: 35 },
      { text: 'Kỳ vọng tăng trưởng đều', score: 65 },
      { text: 'Triển vọng thăng tiến hoặc mở rộng kinh doanh cao', score: 90 },
    ],
  },
  {
    id: 'ca_10',
    category: 'Khả năng tài chính',
    categoryKey: 'CAPACITY',
    weight: 2.0,
    question: 'Tình trạng nhà ở của bạn hiện tại?',
    options: [
      { text: 'Đang thuê nhà và áp lực phí cao', score: 20 },
      { text: 'Thuê nhà nhưng chi phí thấp/sống cùng gia đình', score: 45 },
      { text: 'Đang trả góp mua nhà', score: 65 },
      { text: 'Sở hữu nhà hoàn toàn', score: 90 },
    ],
  },

  // ─────────────────────────────────────────────
  // PILLAR 4: LOSS_AVERSION — Phản ứng thua lỗ (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'la_1',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5, // Important psychological metric
    question: 'Nếu thị trường chung giảm 20% trong 1 tháng, bạn sẽ làm gì?',
    options: [
      { text: 'Bán tháo toàn bộ để cắt lỗ', score: 10 },
      { text: 'Bán một nửa', score: 35 },
      { text: 'Nhắm mắt làm ngơ, giữ nguyên', score: 65 },
      { text: 'Cực kỳ phấn khích và mua thêm', score: 90 },
    ],
  },
  {
    id: 'la_2',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Mở app lên và thấy danh mục đỏ lòm (âm 15%), cảm giác đầu tiên của bạn?',
    options: [
      { text: 'Mất ngủ, hoảng loạn', score: 10 },
      { text: 'Buồn bực, căng thẳng', score: 35 },
      { text: 'Bình thường, hiểu luật chơi', score: 65 },
      { text: 'Nhìn nhận cơ hội', score: 90 },
    ],
  },
  {
    id: 'la_3',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Mức sụt giảm tối đa bạn chịu đựng được mà không bỏ cuộc?',
    options: [
      { text: '-5%', score: 10 },
      { text: '-15%', score: 35 },
      { text: '-30%', score: 65 },
      { text: '-50% hoặc hơn', score: 90 },
    ],
  },
  {
    id: 'la_4',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Khi bạn bè khoe lãi bằng tài sản mạo hiểm, còn danh mục an toàn của bạn dậm chân tại chỗ, bạn sẽ?',
    options: [
      { text: 'Bỏ chiến lược an toàn, chạy theo họ ngay', score: 10 },
      { text: 'Cảm thấy fomo và bực bội', score: 35 },
      { text: 'Vẫn kiên định với chiến lược của mình', score: 70 },
      { text: 'Mừng cho họ, tập trung vào mục tiêu cá nhân', score: 90 },
    ],
  },
  {
    id: 'la_5',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Có tin đồn công ty bạn đang đầu tư gặp rủi ro lớn. Bạn làm gì?',
    options: [
      { text: 'Bán ngay không cần nghĩ', score: 15 },
      { text: 'Theo dõi giá cổ phiếu liên tục', score: 35 },
      { text: 'Tìm kiếm nguồn tin chính thống để xác minh', score: 65 },
      { text: 'Bình tĩnh chờ báo cáo, không hành động theo tin đồn', score: 90 },
    ],
  },
  {
    id: 'la_6',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Điều gì tồi tệ hơn đối với bạn?',
    options: [
      { text: 'Mất đi 10 triệu đồng đã vất vả kiếm được', score: 10 },
      { text: 'Cả hai đều khó chịu như nhau', score: 40 },
      { text: 'Bỏ lỡ cơ hội kiếm được 10 triệu dễ dàng', score: 65 },
      { text: 'Tôi xem cả 2 là một phần của hành trình', score: 90 },
    ],
  },
  {
    id: 'la_7',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Sau khi cắt lỗ một khoản đầu tư, hành động tiếp theo của bạn là gì?',
    options: [
      { text: 'Rút khỏi thị trường vĩnh viễn', score: 10 },
      { text: 'Mua tài sản khác ngay để gỡ gạc', score: 20 },
      { text: 'Dừng lại quan sát một thời gian', score: 65 },
      { text: 'Ghi chép lại bài học và điều chỉnh danh mục', score: 90 },
    ],
  },
  {
    id: 'la_8',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Bạn đồng ý với câu nào sau đây nhất?',
    options: [
      { text: 'Bảo vệ vốn quan trọng hơn mọi thứ', score: 15 },
      { text: 'Kiếm lãi một chút nhưng phải an toàn', score: 40 },
      { text: 'Chấp nhận lỗ ngắn hạn để lãi dài hạn', score: 70 },
      { text: 'Rủi ro càng cao, lợi nhuận càng lớn', score: 90 },
    ],
  },
  {
    id: 'la_9',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Khi mua một tài sản, bạn thường nghĩ về điều gì đầu tiên?',
    options: [
      { text: 'Tôi có thể mất bao nhiêu tiền?', score: 20 },
      { text: 'Lãi suất gửi ngân hàng đang là bao nhiêu?', score: 40 },
      { text: 'Cơ hội phát triển của tài sản này?', score: 70 },
      { text: 'Tôi có thể x2 x3 tài khoản trong bao lâu?', score: 90 },
    ],
  },
  {
    id: 'la_10',
    category: 'Phản ứng thua lỗ',
    categoryKey: 'LOSS_AVERSION',
    weight: 2.5,
    question: 'Cổ phiếu bạn rất tin tưởng vừa giảm 30%. Đây là do thị trường chung xấu. Bạn?',
    options: [
      { text: 'Sợ hãi và tự trách bản thân', score: 10 },
      { text: 'Chấp nhận thương đau và bán', score: 30 },
      { text: 'Giữ nguyên vì lý do đầu tư ban đầu chưa đổi', score: 70 },
      { text: 'Tận dụng gom thêm hàng giá rẻ', score: 90 },
    ],
  },

  // ─────────────────────────────────────────────
  // PILLAR 5: GOAL — Mục tiêu đầu tư (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'go_1',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Ưu tiên số một của bạn khi đầu tư là gì?',
    options: [
      { text: 'Bảo toàn số tiền gốc', score: 15 },
      { text: 'Tạo dòng tiền thu nhập đều đặn', score: 40 },
      { text: 'Tăng trưởng giá trị tài sản', score: 70 },
      { text: 'Tăng trưởng bứt phá bất chấp rủi ro', score: 90 },
    ],
  },
  {
    id: 'go_2',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Bạn kỳ vọng mức lợi nhuận trung bình hàng năm là bao nhiêu?',
    options: [
      { text: 'Khoảng 5 - 7% (ngang tiết kiệm)', score: 15 },
      { text: '8 - 12% (đánh bại lạm phát)', score: 40 },
      { text: '15 - 20% (tăng trưởng tốt)', score: 70 },
      { text: 'Trên 25% (đổi đời)', score: 90 },
    ],
  },
  {
    id: 'go_3',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Giữa 2 danh mục sau, bạn chọn cái nào?',
    options: [
      { text: 'A: Lãi đều 6%/năm, không bao giờ suy giảm', score: 20 },
      { text: 'B: Lãi trung bình 10%, có năm âm 5%', score: 45 },
      { text: 'C: Lãi trung bình 15%, có năm âm 15%', score: 70 },
      { text: 'D: Lãi có thể lên 40%, nhưng có thể chia đôi tài khoản', score: 90 },
    ],
  },
  {
    id: 'go_4',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Bạn coi đầu tư là một công cụ để?',
    options: [
      { text: 'Giữ tiền không bị mất giá', score: 20 },
      { text: 'Thay thế lương hưu sau này', score: 45 },
      { text: 'Đạt tự do tài chính sớm', score: 70 },
      { text: 'Trở nên giàu có nhanh chóng', score: 90 },
    ],
  },
  {
    id: 'go_5',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Nếu tài khoản đạt mục tiêu lợi nhuận sớm hơn dự kiến 2 năm, bạn sẽ?',
    options: [
      { text: 'Chốt lãi toàn bộ và gửi tiết kiệm', score: 20 },
      { text: 'Chốt lời một phần', score: 45 },
      { text: 'Tiếp tục giữ theo kế hoạch thời gian', score: 70 },
      { text: 'Đẩy mục tiêu lợi nhuận lên cao hơn', score: 90 },
    ],
  },
  {
    id: 'go_6',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Bạn muốn cảm giác gì nhất khi nghĩ về khoản đầu tư của mình?',
    options: [
      { text: 'Tuyệt đối an toàn, ngủ ngon giấc', score: 15 },
      { text: 'Cảm thấy tự tin về tương lai', score: 40 },
      { text: 'Thấy thú vị và phấn khích', score: 70 },
      { text: 'Hồi hộp như đánh bạc', score: 90 },
    ],
  },
  {
    id: 'go_7',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Động lực chính thúc đẩy bạn đầu tư?',
    options: [
      { text: 'Sợ lạm phát bào mòn tiền', score: 20 },
      { text: 'Muốn có quỹ dự phòng cho gia đình', score: 45 },
      { text: 'Khát vọng xây dựng sự giàu có', score: 70 },
      { text: 'Chứng tỏ bản thân/Tìm kiếm cảm giác mạnh', score: 90 },
    ],
  },
  {
    id: 'go_8',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Quan điểm của bạn về cổ tức (dòng tiền đều) so với tăng giá vốn?',
    options: [
      { text: 'Chỉ quan tâm dòng tiền đều đặn an toàn', score: 20 },
      { text: 'Ưu tiên cổ tức, giá tăng là phụ', score: 45 },
      { text: 'Cân bằng cả hai', score: 65 },
      { text: 'Bỏ qua cổ tức, tập trung vào tăng giá x2 x3', score: 90 },
    ],
  },
  {
    id: 'go_9',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Bạn muốn tài khoản đầu tư đánh bại lạm phát với khoảng cách bao nhiêu?',
    options: [
      { text: 'Chỉ cần bằng lạm phát là đủ', score: 15 },
      { text: 'Cao hơn lạm phát 2 - 3%', score: 40 },
      { text: 'Gấp đôi lạm phát', score: 70 },
      { text: 'Càng cao càng tốt, lạm phát không phải mốc tôi quan tâm', score: 90 },
    ],
  },
  {
    id: 'go_10',
    category: 'Mục tiêu',
    categoryKey: 'GOAL',
    weight: 1.5,
    question: 'Bạn có sẵn sàng hi sinh thanh khoản (khó rút tiền) để đổi lấy lợi suất cao không?',
    options: [
      { text: 'Không, tiền phải rút được ngay', score: 15 },
      { text: 'Sẵn sàng khóa 1 phần nhỏ', score: 40 },
      { text: 'Sẵn sàng nếu phần thưởng tương xứng', score: 70 },
      { text: 'Rất sẵn lòng, thanh khoản không thành vấn đề', score: 90 },
    ],
  },

  // ─────────────────────────────────────────────
  // PILLAR 6: KNOWLEDGE — Kiến thức tài chính (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'kn_1',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: '"Lạm phát 4%/năm" có ý nghĩa gì đối với tiền của bạn?',
    options: [
      { text: 'Không ảnh hưởng nhiều', score: 10 },
      { text: 'Tiền sẽ mất 4% giá trị mua sắm mỗi năm', score: 40 },
      { text: 'Nên tìm kênh đầu tư lớn hơn 4% để bảo vệ tiền', score: 70 },
      { text: 'Là thuế ẩn, bào mòn tài sản cực kỳ nguy hiểm trong dài hạn', score: 90 },
    ],
  },
  {
    id: 'kn_2',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Khi lãi suất ngân hàng tăng mạnh, điều gì thường xảy ra trên thị trường chứng khoán?',
    options: [
      { text: 'Không biết', score: 10 },
      { text: 'Chứng khoán tăng theo', score: 20 },
      { text: 'Không liên quan', score: 40 },
      { text: 'Chứng khoán thường có xu hướng giảm', score: 90 },
    ],
  },
  {
    id: 'kn_3',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Lãi kép (Compound Interest) hoạt động mạnh nhất khi nào?',
    options: [
      { text: 'Khi đầu tư số tiền lớn', score: 20 },
      { text: 'Khi lợi suất rất cao', score: 40 },
      { text: 'Khi thời gian đầu tư đủ dài', score: 90 },
      { text: 'Khi liên tục chuyển đổi danh mục', score: 10 },
    ],
  },
  {
    id: 'kn_4',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'ETF là viết tắt của quỹ hoán đổi danh mục. Nó là gì?',
    options: [
      { text: 'Chưa từng nghe qua', score: 10 },
      { text: 'Một dạng sổ tiết kiệm mở rộng', score: 20 },
      { text: 'Một quỹ rủi ro siêu cao', score: 30 },
      { text: 'Một rổ cổ phiếu/tài sản giao dịch như cổ phiếu thông thường', score: 90 },
    ],
  },
  {
    id: 'kn_5',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: '"Đa dạng hóa danh mục" mang lại lợi ích gì lớn nhất?',
    options: [
      { text: 'Làm tăng lợi nhuận lên cao nhất', score: 20 },
      { text: 'Đảm bảo không bao giờ bị lỗ', score: 30 },
      { text: 'Giảm thiểu rủi ro phi hệ thống (rủi ro của 1 công ty)', score: 90 },
      { text: 'Làm danh mục đẹp hơn', score: 10 },
    ],
  },
  {
    id: 'kn_6',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Tài sản nào có rủi ro cao nhất trong số này?',
    options: [
      { text: 'Trái phiếu chính phủ', score: 10 },
      { text: 'Vàng', score: 30 },
      { text: 'Cổ phiếu công ty lớn (Bluechip)', score: 60 },
      { text: 'Tiền mã hóa (Crypto) / Hợp đồng phái sinh', score: 90 },
    ],
  },
  {
    id: 'kn_7',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Rủi ro thanh khoản là gì?',
    options: [
      { text: 'Rủi ro bị hack tài khoản', score: 10 },
      { text: 'Rủi ro công ty phá sản', score: 30 },
      { text: 'Rủi ro không thể bán tài sản nhanh chóng mà không mất giá', score: 90 },
      { text: 'Rủi ro thị trường sập', score: 40 },
    ],
  },
  {
    id: 'kn_8',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Trung bình lịch sử, chỉ số S&P 500 tăng trưởng khoảng bao nhiêu mỗi năm?',
    options: [
      { text: 'Không biết', score: 10 },
      { text: 'Dưới 5%', score: 30 },
      { text: 'Khoảng 7-10% (sau lạm phát)', score: 90 },
      { text: 'Trên 20%', score: 20 },
    ],
  },
  {
    id: 'kn_9',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Bạn hiểu "Độ lệch chuẩn" (Standard Deviation) trong đầu tư như thế nào?',
    options: [
      { text: 'Chưa nghe bao giờ', score: 10 },
      { text: 'Mức lợi nhuận cao nhất đạt được', score: 20 },
      { text: 'Số lần thị trường giảm điểm', score: 30 },
      { text: 'Mức độ biến động của tài sản so với trung bình', score: 90 },
    ],
  },
  {
    id: 'kn_10',
    category: 'Kiến thức',
    categoryKey: 'KNOWLEDGE',
    weight: 1.0,
    question: 'Mua trái phiếu doanh nghiệp khác với gửi tiết kiệm ngân hàng ở điểm cốt lõi nào?',
    options: [
      { text: 'Giống hệt nhau, chỉ khác tên', score: 10 },
      { text: 'Trái phiếu sinh lời thấp hơn', score: 20 },
      { text: 'Trái phiếu có kỳ hạn dài hơn', score: 40 },
      { text: 'Trái phiếu không có bảo hiểm tiền gửi, chịu rủi ro doanh nghiệp vỡ nợ', score: 90 },
    ],
  },

  // ─────────────────────────────────────────────
  // PILLAR 7: EMERGENCY_FUND — Quỹ dự phòng (10 câu)
  // ─────────────────────────────────────────────
  {
    id: 'ef_1',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Bạn hiện có bao nhiêu tiền trong quỹ dự phòng khẩn cấp?',
    options: [
      { text: 'Không có đồng nào', score: 10 },
      { text: 'Đủ sống dưới 3 tháng', score: 35 },
      { text: 'Đủ sống 3-6 tháng', score: 65 },
      { text: 'Đủ sống trên 6 tháng', score: 90 },
    ],
  },
  {
    id: 'ef_2',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Hình thức lưu trữ quỹ dự phòng của bạn?',
    options: [
      { text: 'Chưa có quỹ dự phòng', score: 10 },
      { text: 'Mua vàng cất két', score: 40 },
      { text: 'Gửi tiết kiệm linh hoạt dễ rút', score: 90 },
      { text: 'Đem đi đầu tư sinh lời hết', score: 20 },
    ],
  },
  {
    id: 'ef_3',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Gia đình bạn có bảo hiểm sức khỏe/nhân thọ không?',
    options: [
      { text: 'Không có loại bảo hiểm nào', score: 10 },
      { text: 'Chỉ có bảo hiểm y tế nhà nước', score: 35 },
      { text: 'Có bảo hiểm sức khỏe tư nhân', score: 65 },
      { text: 'Bảo vệ toàn diện (Sức khỏe & Nhân thọ)', score: 90 },
    ],
  },
  {
    id: 'ef_4',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Số lượng người phụ thuộc tài chính vào bạn (Bố mẹ già, con nhỏ)?',
    options: [
      { text: 'Trên 3 người', score: 15 },
      { text: '1-2 người', score: 35 },
      { text: 'Không có người phụ thuộc', score: 70 },
      { text: 'Không có, và tôi còn được gia đình hỗ trợ', score: 90 },
    ],
  },
  {
    id: 'ef_5',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Bạn đã từng phải rút tiền từ danh mục đầu tư để trang trải chi phí đột xuất chưa?',
    options: [
      { text: 'Rất thường xuyên', score: 15 },
      { text: 'Đã từng 1-2 lần', score: 40 },
      { text: 'Rất hiếm khi', score: 65 },
      { text: 'Chưa bao giờ, quỹ khẩn cấp lo hết', score: 90 },
    ],
  },
  {
    id: 'ef_6',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Thái độ của bạn về việc để một cục tiền mặt "nằm chết" (không sinh lời cao) trong quỹ khẩn cấp?',
    options: [
      { text: 'Rất xót ruột, muốn đem đi đầu tư hết', score: 15 },
      { text: 'Thấy lãng phí nhưng đành chịu', score: 40 },
      { text: 'Chấp nhận vì đó là rào chắn an toàn', score: 70 },
      { text: 'Hoàn toàn ủng hộ, an tâm tuyệt đối', score: 90 },
    ],
  },
  {
    id: 'ef_7',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Nếu phải nằm viện 2 tháng không làm ra tiền, tình hình tài chính của bạn sẽ?',
    options: [
      { text: 'Kiệt quệ, phải vay nợ', score: 10 },
      { text: 'Khó khăn nhưng xoay xở được', score: 40 },
      { text: 'Giảm sút một chút, bảo hiểm lo phần lớn', score: 70 },
      { text: 'Không suy suyển, dòng tiền dự phòng vững chắc', score: 90 },
    ],
  },
  {
    id: 'ef_8',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Mức độ tiếp cận nguồn vay khẩn cấp của bạn (ví dụ: thẻ tín dụng, gia đình hỗ trợ)?',
    options: [
      { text: 'Không có nguồn hỗ trợ nào', score: 15 },
      { text: 'Chỉ có thẻ tín dụng hạn mức thấp', score: 40 },
      { text: 'Gia đình có thể hỗ trợ nếu cần', score: 70 },
      { text: 'Hạn mức vay lớn, gia đình lực mạnh', score: 90 },
    ],
  },
  {
    id: 'ef_9',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Khoản đầu tư hiện tại của bạn chiếm bao nhiêu so với Quỹ khẩn cấp?',
    options: [
      { text: 'Đầu tư 100%, không có quỹ', score: 10 },
      { text: 'Đầu tư nhiều gấp nhiều lần quỹ khẩn cấp', score: 30 },
      { text: 'Hai bên tương đương nhau', score: 65 },
      { text: 'Quỹ khẩn cấp lớn hơn số tiền mang đi đầu tư', score: 90 },
    ],
  },
  {
    id: 'ef_10',
    category: 'Quỹ dự phòng',
    categoryKey: 'EMERGENCY_FUND',
    weight: 2.0,
    question: 'Bạn định nghĩa tình huống nào thì được phép dùng quỹ khẩn cấp?',
    options: [
      { text: 'Bất cứ khi nào kẹt tiền (mua điện thoại, đi du lịch)', score: 10 },
      { text: 'Cơ hội đầu tư quá ngon đến bất ngờ', score: 20 },
      { text: 'Mất việc, bệnh tật, hư xe nặng', score: 90 },
      { text: 'Sửa nhà, mua sắm lớn', score: 40 },
    ],
  },
];

export const PILLAR_KEYS = [
  'TIME_HORIZON',
  'EXPERIENCE',
  'CAPACITY',
  'LOSS_AVERSION',
  'GOAL',
  'KNOWLEDGE',
  'EMERGENCY_FUND',
] as const;

export type PillarKey = (typeof PILLAR_KEYS)[number];

/** Draw exactly 1 random question per pillar (total: 7 questions) */
export function drawSessionQuestions(): RiskQuestion[] {
  return PILLAR_KEYS.map((key) => {
    const pool = QUESTION_POOL.filter((q) => q.categoryKey === key);
    return pool[Math.floor(Math.random() * pool.length)];
  });
}
