-- ════════════════════════════════════════════════════════════════════
-- email_templates — modèles d'emails réutilisables côté Hub
-- ════════════════════════════════════════════════════════════════════
-- Pas de connexion IMAP/SMTP. Les templates pré-remplissent un compose
-- Outlook Web via deep-link. Variables remplacées côté client par
-- emailTemplates.render().
-- ════════════════════════════════════════════════════════════════════

create table if not exists email_templates (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'autre',  -- introduction|relance|devis|remerciement|rdv|autre
  subject     text default '',
  body        text default '',
  position    int  default 0,
  is_default  boolean default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists email_templates_category_idx on email_templates(category);
create index if not exists email_templates_user_idx on email_templates(user_id);

alter table email_templates enable row level security;

-- Tous les users voient les templates (utile pour partager des modèles
-- internes). Modification réservée au créateur ou aux admins.
create policy email_templates_read on email_templates for select using (true);
create policy email_templates_write on email_templates for insert with check (user_id = auth.uid());
create policy email_templates_update on email_templates for update using (user_id = auth.uid() or user_id is null);
create policy email_templates_delete on email_templates for delete using (user_id = auth.uid() or user_id is null);

-- Quelques templates de démarrage
insert into email_templates (id, name, category, subject, body) values
('TPL_INTRO_001', 'Introduction premier contact', 'introduction',
 'Prise de contact — Astorya SGI',
 E'Bonjour {contact_prenom} {contact_nom},\n\nSuite à notre échange, je me permets de vous adresser une présentation de notre société Astorya SGI, spécialisée dans les solutions informatiques pour les PME.\n\nNotre équipe accompagne actuellement {client_name} sur des problématiques similaires et nous serions ravis d''échanger plus en détail sur vos enjeux.\n\nBien cordialement,\n{owner_name}\nAstorya SGI · 02 85 52 13 95'),
('TPL_RELANCE_001', 'Relance J+5 sans réponse', 'relance',
 'Suivi de notre proposition {opportunity_name}',
 E'Bonjour {contact_prenom} {contact_nom},\n\nJe me permets de revenir vers vous concernant notre proposition {opportunity_name} d''un montant de {amount} adressée la semaine dernière.\n\nAvez-vous eu l''occasion de prendre connaissance du dossier ? Je reste à votre disposition pour répondre à vos éventuelles questions ou organiser un point téléphonique.\n\nBien cordialement,\n{owner_name}'),
('TPL_DEVIS_001', 'Envoi de devis', 'devis',
 'Devis Astorya — {opportunity_name}',
 E'Bonjour {contact_prenom} {contact_nom},\n\nVous trouverez ci-joint le devis correspondant à notre échange du {date_du_jour} concernant {opportunity_name}.\n\nLe montant total s''élève à {amount} HT et inclut l''ensemble des prestations discutées.\n\nN''hésitez pas à revenir vers moi pour tout ajustement ou clarification.\n\nBien cordialement,\n{owner_name}\nAstorya SGI'),
('TPL_RDV_001', 'Confirmation de rendez-vous', 'rdv',
 'Confirmation RDV — {client_name}',
 E'Bonjour {contact_prenom} {contact_nom},\n\nJe confirme notre rendez-vous concernant {opportunity_name}.\n\nL''ordre du jour proposé :\n- Présentation de votre besoin\n- Démonstration de notre solution\n- Échange sur la suite à donner\n\nÀ très vite,\n{owner_name}'),
('TPL_MERCI_001', 'Remerciement signature', 'remerciement',
 'Bienvenue chez Astorya !',
 E'Bonjour {contact_prenom} {contact_nom},\n\nMerci pour votre confiance ! Toute l''équipe Astorya est ravie d''entamer cette collaboration avec {client_name}.\n\nUn chef de projet vous contactera dans les prochains jours pour planifier la mise en service.\n\nÀ très vite,\n{owner_name}\nAstorya SGI')
on conflict (id) do nothing;
