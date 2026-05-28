-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Seed data (tickets + parc IT)
-- ════════════════════════════════════════════════════════════════════
-- À exécuter APRÈS schema.sql, dans le SQL Editor de Supabase.
--
-- Ce fichier reproduit en base les 11 tickets et les 30 équipements du
-- parc IT AXA qu'on voit aujourd'hui en dur dans les composants. Une
-- fois exécuté, l'application les lira depuis Supabase automatiquement.
-- ════════════════════════════════════════════════════════════════════

-- ─── Tickets ─────────────────────────────────────────────────────────
insert into public.tickets (
  id, client_id, title, category, status, priority, lifecycle, billable, billable_note,
  assignee_team, sla_due_at, escalated_at, escalated_reason, escalated_group, opened_at
) values
  ('REQ-1198', 'ACC-0184', 'Arrivée Lucas Bernard — création comptes & matériel',                      'Gestion comptes RH · Onboarding', 'open',        'haute',     'onboarding',  true,  'Prestation hors contrat de maintenance — facturée 380 € HT', 'Pool',       now() + interval '2 days 6 hours',  null, null, null, now() - interval '1 hour'),
  ('REQ-1197', 'ACC-0156', 'Départ Élise Chevalier — désactivation comptes & restitution',             'Gestion comptes RH · Offboarding','in_progress', 'normale',   'offboarding', true,  'Prestation facturée 240 € HT (extinction AD + Microsoft 365 + restitution)', 'Sécurité', now() + interval '4 hours 12 minutes', null, null, null, now() - interval '4 hours'),
  ('INC-2841', 'ACC-0211', 'Imprimante 3e étage en erreur PCL',                                        'Matériel · Imprimante',           'in_progress', 'haute',     null,          false, null, 'Support N1', now() + interval '3 hours 48 minutes',  null, null, null, now() - interval '2 hours'),
  ('INC-2840', 'ACC-0184', 'Impossible d''accéder à SharePoint Direction',                             'Accès & Droits',                  'open',        'critique',  null,          false, null, null,          now() + interval '47 minutes',          now() - interval '14 minutes', 'Aucune réponse sous 15 min sur ticket critique — escalade automatique', 'supervision', now() - interval '28 minutes'),
  ('REQ-1192', 'ACC-0156', 'Demande d''installation d''AutoCAD 2025',                                  'Logiciel · Installation',         'waiting',     'normale',   null,          true,  'Intervention facturable — pas de contrat actif', 'Support N2', now() + interval '1 day 2 hours',       null, null, null, now() - interval '1 day'),
  ('INC-2837', 'ACC-0184', 'VPN se déconnecte toutes les 10 min',                                      'Réseau · VPN',                    'in_progress', 'haute',     null,          false, null, 'Support N2', now() + interval '22 minutes',          now() - interval '35 minutes', 'SLA résolution < 30 min — escalade manuelle par Tom Verdier', 'supervision', now() - interval '1 day'),
  ('INC-2833', 'ACC-0298', 'Outlook : pièces jointes >25 Mo bloquées',                                 'Messagerie',                      'in_progress', 'normale',   null,          false, null, 'Support N1', now() + interval '5 hours 10 minutes',  null, null, null, now() - interval '2 days'),
  ('REQ-1188', 'ACC-0184', 'Nouveau poste — onboarding Camille Dufour',                                'Gestion comptes RH · Onboarding', 'open',        'normale',   'onboarding',  true,  'Prestation hors contrat — facturée 380 € HT', 'Pool', now() + interval '2 days 4 hours',       null, null, null, now() - interval '2 days'),
  ('INC-2829', 'ACC-0103', 'Écran secondaire non détecté sur dock Dell',                               'Matériel · Périphérique',         'resolved',    'basse',     null,          true,  'Intervention facturée — pas de contrat actif', 'Support N2', null,                                   null, null, null, now() - interval '3 days'),
  ('INC-2826', 'ACC-0177', 'Téléphonie Teams — micro saturé en réunion',                               'Téléphonie',                      'resolved',    'normale',   null,          false, null, 'Support N2', null,                                   null, null, null, now() - interval '4 days'),
  ('REQ-1180', 'ACC-0184', 'Accès lecture base RH pour audit interne',                                 'Accès & Droits',                  'closed',      'normale',   null,          false, null, 'Sécurité',   null,                                   null, null, null, now() - interval '6 days')
on conflict (id) do nothing;

-- ─── Parc IT AXA Wealth France (30 équipements) ──────────────────────
insert into public.assets (id, client_id, type, hostname, model, serial, os, assigned_to, bought_on, warranty_end, contract, site, status) values
  -- Serveurs
  ('AX-SRV-001', 'ACC-0184', 'server',  'axa-dc-prod-01',   'Dell PowerEdge R750',             '8K3NM52',           'Windows Server 2022',       'Datacenter Paris',          '2023-04-15', '2027-04-15', 'ProSupport Plus',     'Paris DC', 'active'),
  ('AX-SRV-002', 'ACC-0184', 'server',  'axa-dc-prod-02',   'Dell PowerEdge R750',             '8K3NM68',           'Windows Server 2022',       'Datacenter Paris',          '2023-04-15', '2027-04-15', 'ProSupport Plus',     'Paris DC', 'active'),
  ('AX-SRV-003', 'ACC-0184', 'server',  'axa-app-01',       'HPE ProLiant DL380 Gen10',        'CZJ8412P',          'Ubuntu 22.04 LTS',          'Datacenter Paris',          '2021-09-22', '2026-09-22', 'Foundation Care',     'Paris DC', 'active'),
  ('AX-SRV-004', 'ACC-0184', 'server',  'axa-db-01',        'HPE ProLiant DL380 Gen10',        'CZJ8412R',          'Oracle Linux 9',            'Datacenter Paris',          '2021-09-22', '2026-09-22', 'Foundation Care',     'Paris DC', 'active'),
  ('AX-SRV-005', 'ACC-0184', 'server',  'axa-bkp-legacy',   'Dell PowerEdge R730',             '5Q4LN21',           'Windows Server 2016',       'Datacenter Paris',          '2019-03-10', '2024-03-10', null,                  'Paris DC', 'stock'),
  -- Réseau
  ('AX-NET-001', 'ACC-0184', 'network', 'axa-fw-edge-01',   'Fortinet FortiGate 200F',         'FG200FT22000123',   'FortiOS 7.4.3',             'Infra réseau',              '2024-01-12', '2027-01-12', 'FortiCare 360',       'Paris HQ', 'active'),
  ('AX-NET-002', 'ACC-0184', 'network', 'axa-sw-core-01',   'Cisco Catalyst 9300',             'FCW2540L0AB',       'IOS XE 17.9.3',             'Infra réseau',              '2022-11-08', '2027-11-08', 'Smart Net 24x7',      'Paris HQ', 'active'),
  ('AX-NET-003', 'ACC-0184', 'network', 'axa-sw-core-02',   'Cisco Catalyst 9300',             'FCW2540L0AC',       'IOS XE 17.9.3',             'Infra réseau',              '2022-11-08', '2027-11-08', 'Smart Net 24x7',      'Paris HQ', 'active'),
  ('AX-NET-004', 'ACC-0184', 'network', 'axa-ap-floor-3',   'Aruba AP-635',                    'CN12K85PQ',         'ArubaOS 10.5',              'WiFi étage 3',              '2024-06-20', '2027-06-20', 'Aruba Central',       'Paris HQ', 'active'),
  -- Portables direction
  ('AX-LAP-001', 'ACC-0184', 'laptop',  'ER-LAP-01',        'Apple MacBook Pro 16" M3 Max',    'C02G7K9LMNP',       'macOS 14.5 Sonoma',         'Émilie Roux (VP Innov.)',   '2024-02-08', '2027-02-08', 'AppleCare+',          'Paris HQ', 'active'),
  ('AX-LAP-002', 'ACC-0184', 'laptop',  'AM-LAP-04',        'Dell Latitude 7440',              '5R8KP72',           'Windows 11 Pro 23H2',       'Antoine Mercier (CISO)',    '2023-08-14', '2026-08-14', 'ProSupport Plus',     'Paris HQ', 'active'),
  ('AX-LAP-003', 'ACC-0184', 'laptop',  'JP-LAP-12',        'Dell Latitude 7430',              '5R8KP43',           'Windows 11 Pro 23H2',       'Julien Pasquier (DAF)',     '2022-06-02', '2025-06-02', 'ProSupport',          'Paris HQ', 'active'),
  ('AX-LAP-004', 'ACC-0184', 'laptop',  'ML-LAP-08',        'Dell Latitude 5440',              '4N2HP91',           'Windows 11 Pro 23H2',       'Marie Lopez',               '2024-09-10', '2027-09-10', 'ProSupport',          'Paris HQ', 'active'),
  ('AX-LAP-005', 'ACC-0184', 'laptop',  'CD-LAP-22',        'Dell Latitude 7430',              '5R8KP78',           'Windows 11 Pro 23H2',       'Camille Dufour',            '2022-11-18', '2025-11-18', 'ProSupport',          'Paris HQ', 'active'),
  ('AX-LAP-006', 'ACC-0184', 'laptop',  'LP-LAP-15',        'Lenovo ThinkPad X1 C11',          'PF3YQM1L',          'Windows 11 Pro 23H2',       'Laure Picard',              '2023-04-22', '2026-04-22', 'Premier Support',     'Paris HQ', 'active'),
  ('AX-LAP-007', 'ACC-0184', 'laptop',  'BR-LAP-31',        'Lenovo ThinkPad T14 G3',          'PF4ZQM2A',          'Windows 11 Pro 23H2',       'Benoît Roy',                '2022-03-15', '2025-03-15', null,                  'Paris HQ', 'active'),
  ('AX-LAP-008', 'ACC-0184', 'laptop',  'SR-LAP-19',        'Apple MacBook Air M2',            'C02H8L7MQR',        'macOS 14.5 Sonoma',         'Sarah Renaud',              '2023-11-30', '2026-11-30', 'AppleCare+',          'Paris HQ', 'active'),
  ('AX-LAP-009', 'ACC-0184', 'laptop',  'OB-LAP-44',        'Dell Latitude 5430',              '4N2HP55',           'Windows 10 Pro 22H2',       'Olivier Blanc',             '2020-09-12', '2023-09-12', null,                  'Lyon',     'active'),
  ('AX-LAP-010', 'ACC-0184', 'laptop',  'EC-LAP-37',        'Dell Latitude 5420',              '3M1GN42',           'Windows 10 Pro 22H2',       'Élise Chevalier',           '2019-11-25', '2022-11-25', null,                  'Bordeaux', 'retired'),
  -- Postes fixes
  ('AX-PC-001',  'ACC-0184', 'desktop', 'RECEPT-01',        'Dell OptiPlex 7010',              '9X7VN85',           'Windows 11 Pro 23H2',       'Accueil hall principal',    '2024-03-04', '2027-03-04', 'ProSupport',          'Paris HQ', 'active'),
  ('AX-PC-002',  'ACC-0184', 'desktop', 'SALLE-CONF-A',     'Dell OptiPlex 7010',              '9X7VN86',           'Windows 11 Pro 23H2',       'Salle Cézanne (visio)',     '2024-03-04', '2027-03-04', 'ProSupport',          'Paris HQ', 'active'),
  ('AX-PC-003',  'ACC-0184', 'desktop', 'GRAPH-DESIGN-01',  'Apple iMac M3 24"',               'C02J9N6PRS',        'macOS 14.5 Sonoma',         'Studio Marketing',          '2024-01-18', '2027-01-18', 'AppleCare+',          'Paris HQ', 'active'),
  -- Mobiles
  ('AX-MOB-001', 'ACC-0184', 'mobile',  'iPhone Roux',      'Apple iPhone 15 Pro',             'F2LXM4N5P6',        'iOS 17.5',                  'Émilie Roux',               '2024-02-08', '2025-02-08', null,                  'Paris HQ', 'active'),
  ('AX-MOB-002', 'ACC-0184', 'mobile',  'iPhone Mercier',   'Apple iPhone 14',                 'G3MYN5O6Q7',        'iOS 17.5',                  'Antoine Mercier',           '2023-01-12', '2024-01-12', null,                  'Paris HQ', 'active'),
  ('AX-MOB-003', 'ACC-0184', 'mobile',  'Samsung-Lopez',    'Samsung Galaxy S23',              'RZ8X1234567',       'Android 14 (OneUI 6.1)',    'Marie Lopez',               '2023-09-10', '2025-09-10', null,                  'Paris HQ', 'active'),
  -- Écrans
  ('AX-MON-001', 'ACC-0184', 'display', 'MON-ER-01',        'Dell U3223QE 32"',                'D7K2P8M5',          '—',                         'Émilie Roux',               '2024-02-08', '2027-02-08', 'Advanced Exchange',   'Paris HQ', 'active'),
  ('AX-MON-002', 'ACC-0184', 'display', 'MON-AM-02',        'Dell U2723QE 27"',                'D7K2P8M6',          '—',                         'Antoine Mercier',           '2023-08-14', '2026-08-14', 'Advanced Exchange',   'Paris HQ', 'active'),
  -- Imprimantes
  ('AX-PRT-001', 'ACC-0184', 'printer', 'IMP-ETAGE-3',      'HP LaserJet M507dn',              'VNB3X42KLM',        'HP firmware 2.4',           'Étage 3 — Direction',       '2022-05-20', '2025-05-20', 'HP Care Pack',        'Paris HQ', 'active'),
  ('AX-PRT-002', 'ACC-0184', 'printer', 'IMP-COMPTA',       'Canon imageRUNNER C3326i',        'RZK56789AB',        '—',                         'Service Compta',            '2021-06-14', '2026-06-14', 'Canon Service+',      'Paris HQ', 'active'),
  ('AX-PRT-003', 'ACC-0184', 'printer', 'IMP-LYON',         'HP LaserJet M404dn',              'VNB3X42KMN',        'HP firmware 2.4',           'Bureau Lyon',               '2020-03-08', '2023-03-08', null,                  'Lyon',     'active')
on conflict (id) do nothing;
