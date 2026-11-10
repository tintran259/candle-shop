-- Đăng xuất mọi thiết bị: token cấp trước thời điểm này bị từ chối
ALTER TABLE "LoginGuard" ADD COLUMN "revokedBefore" TIMESTAMP(3);
