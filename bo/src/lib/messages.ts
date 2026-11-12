// Lời nhắn liên hệ: link nhắn Zalo theo SĐT khách để lại (0901 234 567 / +84 901… → zalo.me/0901234567), số không đủ thì null
export function zaloLink(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^84(?=\d{9}$)/, "0");
  return digits.length >= 9 ? `https://zalo.me/${digits}` : null;
}
