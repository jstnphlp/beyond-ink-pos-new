-- Services catalog: add columns + seed data
-- Run after 005_nullable_staff_member.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS base_price numeric(10,2) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS selling_price numeric(10,2) DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed service_categories
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.service_categories (id, name, department, icon) VALUES
  ('e26eaae9-721e-40e7-8b64-a83f90705a0e', 'Standard Printing', 'physical_dept', 'FileText'),
  ('4a2ac246-462c-41c4-8085-a3980c06b382', 'Photo Printing', 'physical_dept', 'Image'),
  ('ef2ac5f1-50b4-4ec5-86ca-f075bf9ebb34', 'Sticker Printing', 'physical_dept', 'Sticker'),
  ('bab4c7dd-dc55-463f-80f5-4d6366e171e2', 'Others', 'physical_dept', 'RectangleHorizontal'),
  ('002d5800-e1d5-47f6-8bfa-9000e1f87ff6', 'Magazine Printing', 'physical_dept', 'BookOpen'),
  ('f2ac3583-47bf-4069-8f29-02bbb51385ea', 'Book Binding', 'physical_dept', 'BookMarked'),
  ('903dfe60-8582-4a06-88d1-b64015bf2466', 'Designing', 'design_dept', 'Palette'),
  ('076eb505-9a5c-468f-8004-5bcb9d32138a', 'Development', 'dev_dept', 'Code2')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, department=EXCLUDED.department, icon=EXCLUDED.icon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed services (no department column — derived from category)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.services (id, name, description, base_price, icon, category_id) VALUES
  ('3e837b1c-55c0-4022-8acb-59b86b43bb3e', 'Standard Printing (Black)', 'B&W document printing per page', 4, 'FileText', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('60e4d600-0954-4744-86e2-d80069b0b144', 'Standard Printing (Colored)', 'Color document printing per page', 7, 'FileText', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('ffd41a04-8c7d-4e34-8e37-00d073a97430', 'Photocopy / Xerox (Black)', 'B&W photocopy per page', 2, 'Copy', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('000fe5b8-b6f4-482a-81e0-7030b6fbcd92', 'Photocopy / Xerox (Colored)', 'Color photocopy per page', 7, 'Copy', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('8a06932e-75b2-4ad2-831d-47bcffb439fc', 'Scanning', 'Document scanning service', 10, 'ScanLine', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'Hot Laminating', 'ID 20 / Half 35 / A4 50', 20, 'Layers', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('b7452ffa-e6ec-4658-895b-d9f051a9e9a2', 'Phototop/Coldtop', 'Cold laminating film A4', 25, 'Layers', 'e26eaae9-721e-40e7-8b64-a83f90705a0e'),
  ('12eb3c6e-63d9-4722-8dca-289c7132cb4c', '2R Photo Print', '2R size photo printing', 8, 'Image', '4a2ac246-462c-41c4-8085-a3980c06b382'),
  ('14ed7e2b-59b7-4e17-88b7-3fdd4d5ac03c', '3R Photo Print', '3R size photo printing', 15, 'Image', '4a2ac246-462c-41c4-8085-a3980c06b382'),
  ('12fa46f8-52de-4744-80f7-a1e04024c1bc', '4R Photo Print', '4R size photo printing', 20, 'Image', '4a2ac246-462c-41c4-8085-a3980c06b382'),
  ('c62ca05f-bdb9-40a3-8c6a-2c7d7b9550fc', 'A4 Photo Print', 'A4 size photo printing', 50, 'Image', '4a2ac246-462c-41c4-8085-a3980c06b382'),
  ('98878d57-3fed-4e6b-8544-355da76a233c', 'Rush ID', 'Quick ID photo printing', 50, 'Camera', '4a2ac246-462c-41c4-8085-a3980c06b382'),
  ('7415f128-666a-4814-8464-1720127f793c', 'Custom Stickers/Labels', 'Glossy 45 / Matte 50 / Vinyl 50', 45, 'Sticker', 'ef2ac5f1-50b4-4ec5-86ca-f075bf9ebb34'),
  ('6f70e9d8-1e5d-4064-8b93-5860712de9bc', 'Sticker on Sintra Board', 'Sticker mounted on sintra board', 150, 'Sticker', 'ef2ac5f1-50b4-4ec5-86ca-f075bf9ebb34'),
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'Certificates & Award', 'Specialty 25 / Parchment 15 / Linen 20', 15, 'Award', 'bab4c7dd-dc55-463f-80f5-4d6366e171e2'),
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'Flyers/Tri-Fold Brochures', 'Brochure 25 / Inkjet 25', 25, 'FileSpreadsheet', 'bab4c7dd-dc55-463f-80f5-4d6366e171e2'),
  ('dd8da488-ad9f-4688-8eb0-184070121200', 'Business Cards', 'Professional business card printing', 50, 'Contact', 'bab4c7dd-dc55-463f-80f5-4d6366e171e2'),
  ('5148a58b-1492-47ff-80a0-927545da0274', 'Invitation Card', 'Passport style invitation card', 25, 'Mail', 'bab4c7dd-dc55-463f-80f5-4d6366e171e2'),
  ('705869ea-116d-4184-86f8-e6a86135186e', 'Simple Editing', 'Basic document editing', 20, 'Pencil', 'bab4c7dd-dc55-463f-80f5-4d6366e171e2'),
  ('2f43b49c-d81e-4ea8-8a0c-0e60f75d7a34', 'Magazine (A4, Colored)', 'C2S 120gsm A4 per page', 35, 'BookOpen', '002d5800-e1d5-47f6-8bfa-9000e1f87ff6'),
  ('12a4170b-5f22-48b9-84f6-6ef34d864fb2', 'Magazine (A5, Colored)', 'C2S 120gsm A5 per page', 15, 'BookOpen', '002d5800-e1d5-47f6-8bfa-9000e1f87ff6'),
  ('d26e4ea2-c28f-4850-8914-22a010e106f2', 'Magazine (A4, B&W)', 'A4 B&W magazine per page', 5, 'BookOpen', '002d5800-e1d5-47f6-8bfa-9000e1f87ff6'),
  ('b4c3d7c8-2425-4112-8701-741090e6c6da', 'Spiral/Coil Binding', 'Spiral coil binding per book', 50, 'BookMarked', 'f2ac3583-47bf-4069-8f29-02bbb51385ea'),
  ('56c738cf-5126-425b-84f1-3f9507e1aa94', 'Tape Binding', 'Tape binding per book', 40, 'BookMarked', 'f2ac3583-47bf-4069-8f29-02bbb51385ea'),
  ('d1ace5e2-faaa-473c-8dd4-0ef82b0662de', 'Saddle-Stitch Binding', 'Saddle-stitch binding per book', 30, 'BookMarked', 'f2ac3583-47bf-4069-8f29-02bbb51385ea'),
  ('dcd98bac-31d4-4bc6-82a3-ab08ed0d706a', 'Hard-Bound Binding', 'Hardbound binding per book', 250, 'BookMarked', 'f2ac3583-47bf-4069-8f29-02bbb51385ea'),
  ('09fd9dd0-cea5-4e6c-81ba-f3c0c758e3bc', 'Staple Binding', 'Staple binding per book', 100, 'BookMarked', 'f2ac3583-47bf-4069-8f29-02bbb51385ea'),
  ('df16a33f-e1f5-4cfb-8827-b2c53ee3ffc4', 'Logo Design', 'Custom brand identity and logo', 500, 'Palette', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('dad0f3ad-dd87-46b5-8e83-d75107577518', 'Brand Identity Package', 'Full brand identity package', 2000, 'Palette', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('e207b5f0-1962-4904-8ec3-47c0fb65acf4', 'Social Media Graphics', 'Social platform templates', 300, 'Share2', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('d8a21a27-c0f4-4675-88f2-5dd318569c52', 'Poster/Flyer Design', 'Poster and flyer design', 200, 'Image', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('bd86d776-2415-4ee2-8207-ea2c99933994', 'UI/UX Design', 'User interface design', 1500, 'Layout', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('6eebe678-21ea-42f6-8e9e-e7504f01548e', 'Layout Design', 'Document layout design', 150, 'LayoutGrid', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('c5affd2a-7f21-4ac2-8750-bdd4ba8ed7e8', 'Photo Editing', 'Professional photo editing', 150, 'ImagePlus', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('294150e9-8e52-498b-850e-3f83a7137962', 'Video Editing', 'Video editing service', 150, 'Video', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('4045fe0b-92c6-400d-8459-868fd2831e06', 'Motion Graphics', 'Animated motion graphics', 800, 'Film', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('2b39ed64-648c-4db4-84fb-be504fb5d0d0', 'Video Production', 'Full video production', 3000, 'Video', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('e145ee5d-0fa9-4f79-80e1-4cf5eeec1124', 'Animation', 'Custom animation work', 1500, 'PlayCircle', '903dfe60-8582-4a06-88d1-b64015bf2466'),
  ('77a5f63a-585d-4574-815c-94482ff8434e', 'Business Website', 'Professional business website', 5000, 'Globe', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('23c2d24b-494a-40d7-854c-9cfd6a88d29c', 'E-commerce Site', 'Online store development', 10000, 'ShoppingCart', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('d77c6298-7854-48ae-839b-4350af28ba36', 'Landing Page', 'Single page landing site', 2000, 'Monitor', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('ccb053a7-c975-40bb-83b9-2afd05c5231c', 'Web Application', 'Custom web application', 15000, 'Code2', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('c0858dcc-7fb6-4dda-8222-9bb8bf33e016', 'Custom Software', 'Bespoke software development', 20000, 'Cpu', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('ea62cb40-a5b5-4804-85fd-2d004fd72344', 'API Integration', 'Third-party API integration', 5000, 'Plug', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('cb64e907-ee11-403b-848a-e49d2575b93c', 'Database Setup', 'Database design and setup', 3000, 'Database', '076eb505-9a5c-468f-8004-5bcb9d32138a'),
  ('48cbd0d4-e98f-4aa0-8c95-cc80a1441a74', 'Technical Consultation', 'Technical consulting per hour', 500, 'MessageSquare', '076eb505-9a5c-468f-8004-5bcb9d32138a')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, base_price=EXCLUDED.base_price, icon=EXCLUDED.icon, category_id=EXCLUDED.category_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed inventory_items (materials)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.inventory_items (id, name, unit, selling_price) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Standard Short Bondpaper', 'pcs', 4),
  ('c0000000-0000-0000-0000-000000000002', 'Standard Long Bondpaper', 'pcs', 5),
  ('c0000000-0000-0000-0000-000000000003', 'Colored Short Bondpaper', 'pcs', 7),
  ('c0000000-0000-0000-0000-000000000004', 'Colored Long Bondpaper', 'pcs', 8),
  ('c0000000-0000-0000-0000-000000000005', 'Photo Paper Glossy 2R', 'pcs', 3),
  ('c0000000-0000-0000-0000-000000000006', 'Photo Paper Glossy 3R', 'pcs', 5),
  ('c0000000-0000-0000-0000-000000000007', 'Photo Paper Glossy 4R', 'pcs', 8),
  ('c0000000-0000-0000-0000-000000000008', 'Photo Paper Glossy A4', 'pcs', 20),
  ('c0000000-0000-0000-0000-000000000009', 'Sticker Paper Glossy A4', 'pcs', 25),
  ('c0000000-0000-0000-0000-000000000010', 'Sticker Paper Matte A4', 'pcs', 30),
  ('c0000000-0000-0000-0000-000000000011', 'Sticker Paper Vinyl A4', 'pcs', 30),
  ('c0000000-0000-0000-0000-000000000012', 'Sintra Board A4', 'pcs', 100),
  ('c0000000-0000-0000-0000-000000000013', 'Laminating Film ID Size', 'pcs', 10),
  ('c0000000-0000-0000-0000-000000000014', 'Laminating Film Half Size', 'pcs', 15),
  ('c0000000-0000-0000-0000-000000000015', 'Laminating Film A4', 'pcs', 20),
  ('c0000000-0000-0000-0000-000000000016', 'Coldtop Film A4', 'pcs', 15),
  ('c0000000-0000-0000-0000-000000000017', 'Certificate Paper Specialty', 'pcs', 15),
  ('c0000000-0000-0000-0000-000000000018', 'Certificate Paper Parchment', 'pcs', 10),
  ('c0000000-0000-0000-0000-000000000019', 'Certificate Paper Linen', 'pcs', 12),
  ('c0000000-0000-0000-0000-000000000020', 'C2S Paper 120gsm A4', 'pcs', 15),
  ('c0000000-0000-0000-0000-000000000021', 'C2S Paper 120gsm A5', 'pcs', 8),
  ('c0000000-0000-0000-0000-000000000022', 'Spiral Coil', 'pcs', 15),
  ('c0000000-0000-0000-0000-000000000023', 'Tape Binding Strip', 'pcs', 10),
  ('c0000000-0000-0000-0000-000000000024', 'Book Board (Hardbound)', 'set', 80),
  ('c0000000-0000-0000-0000-000000000025', 'Staple Wire', 'box', 30),
  ('c0000000-0000-0000-0000-000000000026', 'Business Card Paper', 'pcs', 3),
  ('c0000000-0000-0000-0000-000000000027', 'Invitation Card Paper', 'pcs', 5),
  ('c0000000-0000-0000-0000-000000000028', 'Brochure Paper A4', 'pcs', 10),
  ('c0000000-0000-0000-0000-000000000029', 'Flyer Paper A4', 'pcs', 8),
  ('c0000000-0000-0000-0000-000000000030', 'ID Photo Paper', 'pcs', 15),
  ('c0000000-0000-0000-0000-000000000031', 'Photo Paper Matte 2R', 'pcs', 3),
  ('c0000000-0000-0000-0000-000000000032', 'Photo Paper Matte 3R', 'pcs', 5),
  ('c0000000-0000-0000-0000-000000000033', 'Photo Paper Matte 4R', 'pcs', 8),
  ('c0000000-0000-0000-0000-000000000034', 'Photo Paper Matte A4', 'pcs', 20),
  ('c0000000-0000-0000-0000-000000000035', 'Poster Paper A3', 'pcs', 25),
  ('c0000000-0000-0000-0000-000000000036', 'Inkjet Paper A4', 'pcs', 10),
  ('c0000000-0000-0000-0000-000000000037', 'Sticker Paper Glossy A3', 'pcs', 40),
  ('c0000000-0000-0000-0000-000000000038', 'Sticker Paper Matte A3', 'pcs', 45),
  ('c0000000-0000-0000-0000-000000000039', 'Sticker Paper Vinyl A3', 'pcs', 45)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, unit=EXCLUDED.unit, selling_price=EXCLUDED.selling_price;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Create unique index for service_material_prices (needed for ON CONFLICT)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_smp_svc_item ON public.service_material_prices(service_id, inventory_item_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed service_material_prices
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.service_material_prices (service_id, inventory_item_id, suggested_unit_price) VALUES
  ('3e837b1c-55c0-4022-8acb-59b86b43bb3e', 'c0000000-0000-0000-0000-000000000001', 4),
  ('3e837b1c-55c0-4022-8acb-59b86b43bb3e', 'c0000000-0000-0000-0000-000000000002', 5),
  ('60e4d600-0954-4744-86e2-d80069b0b144', 'c0000000-0000-0000-0000-000000000003', 7),
  ('60e4d600-0954-4744-86e2-d80069b0b144', 'c0000000-0000-0000-0000-000000000004', 8),
  ('ffd41a04-8c7d-4e34-8e37-00d073a97430', 'c0000000-0000-0000-0000-000000000001', 2),
  ('ffd41a04-8c7d-4e34-8e37-00d073a97430', 'c0000000-0000-0000-0000-000000000002', 3),
  ('000fe5b8-b6f4-482a-81e0-7030b6fbcd92', 'c0000000-0000-0000-0000-000000000003', 7),
  ('000fe5b8-b6f4-482a-81e0-7030b6fbcd92', 'c0000000-0000-0000-0000-000000000004', 8),
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'c0000000-0000-0000-0000-000000000013', 20),
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'c0000000-0000-0000-0000-000000000014', 35),
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'c0000000-0000-0000-0000-000000000015', 50),
  ('b7452ffa-e6ec-4658-895b-d9f051a9e9a2', 'c0000000-0000-0000-0000-000000000016', 25),
  ('12eb3c6e-63d9-4722-8dca-289c7132cb4c', 'c0000000-0000-0000-0000-000000000005', 8),
  ('14ed7e2b-59b7-4e17-88b7-3fdd4d5ac03c', 'c0000000-0000-0000-0000-000000000006', 15),
  ('12fa46f8-52de-4744-80f7-a1e04024c1bc', 'c0000000-0000-0000-0000-000000000007', 20),
  ('c62ca05f-bdb9-40a3-8c6a-2c7d7b9550fc', 'c0000000-0000-0000-0000-000000000008', 50),
  ('98878d57-3fed-4e6b-8544-355da76a233c', 'c0000000-0000-0000-0000-000000000030', 50),
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000009', 45),
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000010', 50),
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000011', 50),
  ('6f70e9d8-1e5d-4064-8b93-5860712de9bc', 'c0000000-0000-0000-0000-000000000012', 150),
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'c0000000-0000-0000-0000-000000000017', 25),
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'c0000000-0000-0000-0000-000000000018', 15),
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'c0000000-0000-0000-0000-000000000019', 20),
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'c0000000-0000-0000-0000-000000000028', 25),
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'c0000000-0000-0000-0000-000000000029', 25),
  ('dd8da488-ad9f-4688-8eb0-184070121200', 'c0000000-0000-0000-0000-000000000026', 50),
  ('5148a58b-1492-47ff-80a0-927545da0274', 'c0000000-0000-0000-0000-000000000027', 25),
  ('2f43b49c-d81e-4ea8-8a0c-0e60f75d7a34', 'c0000000-0000-0000-0000-000000000020', 35),
  ('12a4170b-5f22-48b9-84f6-6ef34d864fb2', 'c0000000-0000-0000-0000-000000000021', 15),
  ('d26e4ea2-c28f-4850-8914-22a010e106f2', 'c0000000-0000-0000-0000-000000000001', 5),
  ('b4c3d7c8-2425-4112-8701-741090e6c6da', 'c0000000-0000-0000-0000-000000000022', 50),
  ('56c738cf-5126-425b-84f1-3f9507e1aa94', 'c0000000-0000-0000-0000-000000000023', 40),
  ('dcd98bac-31d4-4bc6-82a3-ab08ed0d706a', 'c0000000-0000-0000-0000-000000000024', 250),
  ('09fd9dd0-cea5-4e6c-81ba-f3c0c758e3bc', 'c0000000-0000-0000-0000-000000000025', 100),
  ('12eb3c6e-63d9-4722-8dca-289c7132cb4c', 'c0000000-0000-0000-0000-000000000031', 8),
  ('14ed7e2b-59b7-4e17-88b7-3fdd4d5ac03c', 'c0000000-0000-0000-0000-000000000032', 15),
  ('12fa46f8-52de-4744-80f7-a1e04024c1bc', 'c0000000-0000-0000-0000-000000000033', 20),
  ('c62ca05f-bdb9-40a3-8c6a-2c7d7b9550fc', 'c0000000-0000-0000-0000-000000000034', 50),
  ('c62ca05f-bdb9-40a3-8c6a-2c7d7b9550fc', 'c0000000-0000-0000-0000-000000000035', 50),
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'c0000000-0000-0000-0000-000000000036', 25),
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000037', 45),
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000038', 50),
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000039', 50)
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET suggested_unit_price=EXCLUDED.suggested_unit_price;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Performance indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_dept ON public.service_categories(department);
CREATE INDEX IF NOT EXISTS idx_smp_service ON public.service_material_prices(service_id);
CREATE INDEX IF NOT EXISTS idx_smp_item ON public.service_material_prices(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON public.inventory_items(name);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS + Grants
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') THEN
    EXECUTE 'ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_categories_select' AND tablename = 'service_categories') THEN
      EXECUTE 'CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_categories_insert' AND tablename = 'service_categories') THEN
      EXECUTE 'CREATE POLICY "service_categories_insert" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_categories_update' AND tablename = 'service_categories') THEN
      EXECUTE 'CREATE POLICY "service_categories_update" ON public.service_categories FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    EXECUTE 'ALTER TABLE public.services ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'services_select' AND tablename = 'services') THEN
      EXECUTE 'CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'services_insert' AND tablename = 'services') THEN
      EXECUTE 'CREATE POLICY "services_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'services_update' AND tablename = 'services') THEN
      EXECUTE 'CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
    EXECUTE 'ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_items_select' AND tablename = 'inventory_items') THEN
      EXECUTE 'CREATE POLICY "inventory_items_select" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_items_insert' AND tablename = 'inventory_items') THEN
      EXECUTE 'CREATE POLICY "inventory_items_insert" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_items_update' AND tablename = 'inventory_items') THEN
      EXECUTE 'CREATE POLICY "inventory_items_update" ON public.inventory_items FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_material_prices') THEN
    EXECUTE 'ALTER TABLE public.service_material_prices ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'smp_select' AND tablename = 'service_material_prices') THEN
      EXECUTE 'CREATE POLICY "smp_select" ON public.service_material_prices FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'smp_insert' AND tablename = 'service_material_prices') THEN
      EXECUTE 'CREATE POLICY "smp_insert" ON public.service_material_prices FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'smp_update' AND tablename = 'service_material_prices') THEN
      EXECUTE 'CREATE POLICY "smp_update" ON public.service_material_prices FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;
END
$$;

GRANT ALL ON public.service_categories TO anon, authenticated, service_role;
GRANT ALL ON public.services TO anon, authenticated, service_role;
GRANT ALL ON public.inventory_items TO anon, authenticated, service_role;
GRANT ALL ON public.service_material_prices TO anon, authenticated, service_role;
