-- ==============================================================================
-- COZY LAB — Development Seed Data (DEMO / PLACEHOLDER ONLY)
-- Designed and developed by NOVEN.CODE
--
-- IMPORTANT:
-- Do NOT use placeholder data as verified business facts in production.
-- All unverified addresses, prices, and placeholder profiles are explicitly flagged.
-- ==============================================================================

-- Roles & Permissions
INSERT INTO roles (code, name_i18n, description) VALUES
  ('OWNER', '{"ru":"Владелец","kk":"Иесі","en":"Owner"}', 'Full access across all branches, analytics, staff, and settings'),
  ('MANAGER', '{"ru":"Управляющий","kk":"Менеджер","en":"Manager"}', 'Branch-scoped management, analytics, staff, and appointments'),
  ('ADMINISTRATOR', '{"ru":"Администратор","kk":"Әкімші","en":"Administrator"}', 'Client, appointment, and schedule management with limited financial access'),
  ('MASTER', '{"ru":"Мастер","kk":"Шебер","en":"Master"}', 'Own schedule, own appointments, and assigned client view')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
  ('branches.manage', 'Create, edit, activate/deactivate branches'),
  ('branches.view_all', 'View all branches'),
  ('analytics.financial.full', 'View full financial analytics across branches'),
  ('analytics.financial.branch', 'View branch financial analytics'),
  ('payments.record', 'Record appointment payments'),
  ('appointments.manage', 'Create, confirm, reschedule, cancel, complete appointments'),
  ('clients.manage', 'View and edit client profiles'),
  ('employees.manage', 'Create, edit, activate/deactivate employees and schedules'),
  ('services.manage', 'Create, edit, archive services and categories'),
  ('settings.manage', 'Manage global CRM settings and audit logs')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code) VALUES
  ('OWNER', 'branches.manage'),
  ('OWNER', 'branches.view_all'),
  ('OWNER', 'analytics.financial.full'),
  ('OWNER', 'analytics.financial.branch'),
  ('OWNER', 'payments.record'),
  ('OWNER', 'appointments.manage'),
  ('OWNER', 'clients.manage'),
  ('OWNER', 'employees.manage'),
  ('OWNER', 'services.manage'),
  ('OWNER', 'settings.manage'),
  ('MANAGER', 'analytics.financial.branch'),
  ('MANAGER', 'payments.record'),
  ('MANAGER', 'appointments.manage'),
  ('MANAGER', 'clients.manage'),
  ('MANAGER', 'employees.manage'),
  ('MANAGER', 'services.manage'),
  ('ADMINISTRATOR', 'appointments.manage'),
  ('ADMINISTRATOR', 'clients.manage'),
  ('ADMINISTRATOR', 'payments.record')
ON CONFLICT DO NOTHING;

-- Payment Methods
INSERT INTO payment_methods (code, name_i18n, is_active) VALUES
  ('KASPI_QR', '{"ru":"Kaspi QR / Перевод","kk":"Kaspi QR / Аударым","en":"Kaspi QR / Transfer"}', true),
  ('CARD', '{"ru":"Банковская карта","kk":"Банк картасы","en":"Bank Card"}', true),
  ('CASH', '{"ru":"Наличные","kk":"Қолма-қол","en":"Cash"}', true)
ON CONFLICT (code) DO NOTHING;

-- Branches (Initial known addresses flagged for client verification)
INSERT INTO branches (id, slug, name, address, is_verified_address, phone, whatsapp_phone, working_hours, is_active, sort_order) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'rozybakieva-181a',
    'COZY LAB — Розыбакиева',
    'Алматы, ул. Розыбакиева, 181А (адрес на подтверждении)',
    false,
    '+7 (700) 000-00-01',
    '77000000001',
    '{"mon":"10:00-20:00","tue":"10:00-20:00","wed":"10:00-20:00","thu":"10:00-20:00","fri":"10:00-20:00","sat":"10:00-20:00","sun":"10:00-19:00"}'::jsonb,
    true,
    1
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'gagarina-124',
    'COZY LAB — Гагарина',
    'Алматы, пр. Юрия Гагарина, 124, 3 этаж (адрес на подтверждении)',
    false,
    '+7 (700) 000-00-02',
    '77000000002',
    '{"mon":"10:00-20:00","tue":"10:00-20:00","wed":"10:00-20:00","thu":"10:00-20:00","fri":"10:00-20:00","sat":"10:00-20:00","sun":"10:00-19:00"}'::jsonb,
    true,
    2
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'branch-3-pending',
    'COZY LAB — Филиал №3 (скоро)',
    'Алматы — адрес третьего филиала уточняется',
    false,
    NULL,
    NULL,
    '{"mon":"10:00-20:00","tue":"10:00-20:00","wed":"10:00-20:00","thu":"10:00-20:00","fri":"10:00-20:00","sat":"10:00-20:00","sun":"10:00-19:00"}'::jsonb,
    false,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- Demo Service Categories (Editable in CRM)
INSERT INTO service_categories (id, slug, name_i18n, description_i18n, sort_order) VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    'nails',
    '{"ru":"Ногтевой сервис","kk":"Тырнақ сервисі","en":"Nail Care"}',
    '{"ru":"Эстетический маникюр, педикюр и уход за руками","kk":"Эстетикалық маникюр, педикюр және қол күтімі","en":"Aesthetic manicure, pedicure, and hand care"}',
    1
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'brows-lashes',
    '{"ru":"Брови и ресницы","kk":"Қас пен кірпік","en":"Brows & Lashes"}',
    '{"ru":"Архитектура бровей, ламинирование и деликатный уход","kk":"Қас архитектурасы, ламинация және нәзік күтім","en":"Brow architecture, lamination, and delicate care"}',
    2
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'hair-care',
    '{"ru":"Уход и укладка волос","kk":"Шаш күтімі және сәндеу","en":"Hair Care & Styling"}',
    '{"ru":"Восстанавливающие ритуалы и укладки","kk":"Қалпына келтіру рәсімдері және сәндеу","en":"Restorative rituals and styling"}',
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- Demo Services (Prices marked unverified until client confirmation)
INSERT INTO services (id, category_id, slug, name_i18n, description_i18n, price_kzt, is_price_verified, duration_minutes, is_popular) VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    '22222222-2222-4222-8222-222222222201',
    'signature-manicure',
    '{"ru":"Эстетический маникюр с покрытием","kk":"Жабындысы бар эстетикалық маникюр","en":"Signature Manicure with Gel"}',
    '{"ru":"Демо-описание: бережная обработка, выравнивание и стойкое покрытие.","kk":"Демо-сипаттама: ұқыпты өңдеу, тегістеу және берік жабын.","en":"Demo description: gentle cuticle care, leveling, and long-wear finish."}',
    NULL,
    false,
    90,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '22222222-2222-4222-8222-222222222202',
    'brow-architecture',
    '{"ru":"Архитектура и окрашивание бровей","kk":"Қас архитектурасы және бояу","en":"Brow Architecture & Tinting"}',
    '{"ru":"Демо-описание: подбор формы с учётом черт лица и стойкое окрашивание.","kk":"Демо-сипаттама: бет пішініне сай форма таңдау және бояу.","en":"Demo description: tailored brow shaping and tinting."}',
    NULL,
    false,
    60,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '22222222-2222-4222-8222-222222222203',
    'silk-hair-ritual',
    '{"ru":"Спа-ритуал восстановления волос","kk":"Шашты қалпына келтіру спа-рәсімі","en":"Restorative Hair Spa Ritual"}',
    '{"ru":"Демо-описание: глубокое питание и укладка.","kk":"Демо-сипаттама: терең нәрлендіру және сәндеу.","en":"Demo description: deep nourishment and blow-dry styling."}',
    NULL,
    false,
    75,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Link demo services to active branches
INSERT INTO branch_services (branch_id, service_id, is_active) VALUES
  ('11111111-1111-4111-8111-111111111101', '33333333-3333-4333-8333-333333333301', true),
  ('11111111-1111-4111-8111-111111111101', '33333333-3333-4333-8333-333333333302', true),
  ('11111111-1111-4111-8111-111111111102', '33333333-3333-4333-8333-333333333301', true),
  ('11111111-1111-4111-8111-111111111102', '33333333-3333-4333-8333-333333333303', true)
ON CONFLICT DO NOTHING;

-- Demo Master Profiles (Clearly labeled as placeholder profiles)
INSERT INTO employees (id, branch_id, full_name, specialization_i18n, bio_i18n, experience_verified, is_master, is_active) VALUES
  (
    '44444444-4444-4444-8444-444444444401',
    '11111111-1111-4111-8111-111111111101',
    'Мастер (профиль на заполнении №1)',
    '{"ru":"Топ-мастер ногтевого сервиса","kk":"Тырнақ сервисінің топ-шебері","en":"Senior Nail Artist"}',
    '{"ru":"Демо-профиль. Биография и реальное имя мастера будут добавлены администратором в CRM.","kk":"Демо-профиль. Шебердің нақты аты мен өмірбаяны CRM арқылы қосылады.","en":"Demo profile. Verified master name and biography will be updated in CRM."}',
    false,
    true,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '11111111-1111-4111-8111-111111111102',
    'Мастер (профиль на заполнении №2)',
    '{"ru":"Стилист по бровям и уходу за волосами","kk":"Қас және шаш күтімі стилисті","en":"Brow & Hair Care Stylist"}',
    '{"ru":"Демо-профиль. Биография и реальное имя мастера будут добавлены администратором в CRM.","kk":"Демо-профиль. Шебердің нақты аты мен өмірбаяны CRM арқылы қосылады.","en":"Demo profile. Verified master name and biography will be updated in CRM."}',
    false,
    true,
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO employee_services (employee_id, service_id) VALUES
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301'),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333302'),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333303')
ON CONFLICT DO NOTHING;

-- Weekly schedules for demo masters (Mon-Sat 10:00-20:00, break 13:00-14:00)
INSERT INTO schedules (employee_id, branch_id, day_of_week, is_working, start_time, end_time, break_start, break_end)
SELECT
  '44444444-4444-4444-8444-444444444401',
  '11111111-1111-4111-8111-111111111101',
  d,
  d BETWEEN 1 AND 6,
  '10:00'::TIME,
  '20:00'::TIME,
  '13:00'::TIME,
  '14:00'::TIME
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

INSERT INTO schedules (employee_id, branch_id, day_of_week, is_working, start_time, end_time, break_start, break_end)
SELECT
  '44444444-4444-4444-8444-444444444402',
  '11111111-1111-4111-8111-111111111102',
  d,
  d BETWEEN 1 AND 6,
  '10:00'::TIME,
  '20:00'::TIME,
  '13:30'::TIME,
  '14:30'::TIME
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;
