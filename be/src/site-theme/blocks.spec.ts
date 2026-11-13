// Các khối trang chủ: ghép từng trường lên Mặc định (bước Nghệ thuật đốt nến ghép theo từng bước), ẩn / hiện theo giao diện; kiểm tra số dòng
import { checkLines, mergeBlocks } from './blocks.js';

describe('mergeBlocks', () => {
  it('trường trống lấy của Mặc định; hidden: false của giao diện concept đè lên Mặc định; bước ghép theo vị trí', () => {
    const base = {
      story: { image: 'https://x/story.jpg', title: 'Câu\nchuyện', body: 'Đoạn 1\nĐoạn 2', hidden: true },
      care: { title: 'Nghệ thuật\nđốt nến', steps: [{ title: 'Cắt bấc', text: 'Giữ bấc 0,5 cm' }, { title: 'Đốt đủ lâu' }] },
      footer: { tagline: 'Nến chăm chút.' },
    };
    const noel = {
      story: { title: 'Mùa\nlễ hội', body: '', hidden: false },
      care: { steps: [{ text: 'Bấc ngắn cho ngọn lửa Noel' }, {}, { title: 'Gói quà' }] },
      contact: { hidden: true, heading: 'Đặt quà Noel?' },
    };
    const r = mergeBlocks(noel, base);
    expect(r.story).toEqual({ image: 'https://x/story.jpg', title: 'Mùa\nlễ hội', body: 'Đoạn 1\nĐoạn 2', hidden: false });
    expect(r.care).toEqual({
      title: 'Nghệ thuật\nđốt nến',
      steps: [{ title: 'Cắt bấc', text: 'Bấc ngắn cho ngọn lửa Noel' }, { title: 'Đốt đủ lâu' }, { title: 'Gói quà' }],
    });
    expect(r.contact).toEqual({ hidden: true, heading: 'Đặt quà Noel?' });
    expect(r.footer).toEqual({ tagline: 'Nến chăm chút.' });
    expect(mergeBlocks(undefined, undefined)).toEqual({ story: {}, care: {}, contact: {}, footer: {} });
  });
});

describe('checkLines', () => {
  it('quá số dòng hoặc ký tự mỗi dòng thì trả câu lỗi; dòng trống không tính', () => {
    expect(checkLines({ story: { title: 'Câu\nchuyện' }, care: { title: 'Nghệ thuật\n\nđốt nến' } })).toBeNull();
    expect(checkLines({ story: { title: 'Một\nHai\nBa' } })).toBe('Tên khối Câu chuyện tối đa 2 dòng, mỗi dòng 20 ký tự.');
    expect(checkLines({ contact: { title: 'Một dòng rất rất rất dài quá' } })).toBe('Tên khối Gửi lời nhắn tối đa 2 dòng, mỗi dòng 20 ký tự.');
    expect(checkLines({ story: { body: 'a\nb\nc\nd' } })).toBe('Đoạn văn Câu chuyện tối đa 3 dòng, mỗi dòng 300 ký tự.');
  });
});
