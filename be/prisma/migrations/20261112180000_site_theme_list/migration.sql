-- Giao diện web thành danh sách: mỗi giao diện một dòng (Mặc định + giao diện theo concept), nháp / đã đăng riêng.
-- Chuyển dữ liệu cũ (một bản JSON {base, concepts[]} cho đã đăng và nháp): base → "default", mỗi concept → giao diện "concept-<mã>"
ALTER TABLE "SiteTheme" RENAME TO "SiteTheme_old";
ALTER TABLE "SiteTheme_old" RENAME CONSTRAINT "SiteTheme_pkey" TO "SiteTheme_old_pkey";

CREATE TABLE "SiteTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "published" JSONB,
    "draft" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteTheme" ("id", "name", "published", "draft", "publishedAt", "updatedAt")
SELECT 'default', 'Mặc định',
    (SELECT "data"->'base' FROM "SiteTheme_old" WHERE "id" = 'published'),
    (SELECT "data"->'base' FROM "SiteTheme_old" WHERE "id" = 'draft'),
    (SELECT "updatedAt" FROM "SiteTheme_old" WHERE "id" = 'published'),
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "SiteTheme_old");

WITH parts AS (
    SELECT o."id" AS kind, e AS part, e->>'conceptId' AS cid, o."updatedAt"
    FROM "SiteTheme_old" o, jsonb_array_elements(o."data"->'concepts') e
), ids AS (SELECT DISTINCT cid FROM parts)
INSERT INTO "SiteTheme" ("id", "name", "published", "draft", "publishedAt", "updatedAt")
SELECT 'concept-' || ids.cid, COALESCE(c."nameVi", ids.cid),
    (SELECT (p.part - 'conceptId') || jsonb_build_object('conceptIds', jsonb_build_array(ids.cid)) FROM parts p WHERE p.cid = ids.cid AND p.kind = 'published'),
    (SELECT (p.part - 'conceptId') || jsonb_build_object('conceptIds', jsonb_build_array(ids.cid)) FROM parts p WHERE p.cid = ids.cid AND p.kind = 'draft'),
    (SELECT p."updatedAt" FROM parts p WHERE p.cid = ids.cid AND p.kind = 'published'),
    CURRENT_TIMESTAMP
FROM ids LEFT JOIN "Concept" c ON c."id" = ids.cid;

DROP TABLE "SiteTheme_old";
