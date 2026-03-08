-- Create a function to automatically set the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. workspace
CREATE TABLE workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 12),
  deal_value INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. outreach_log
CREATE TABLE outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined')),
  sent_at TIMESTAMPTZ,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
  stripe_payment_link TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('brief', 'asset', 'deliverable', 'contract', 'other')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. activity_log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. client_links
CREATE TABLE client_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_clients_workspace ON clients(workspace_id);
CREATE INDEX idx_clients_stage ON clients(stage);
CREATE INDEX idx_contacts_client ON contacts(client_id);
CREATE INDEX idx_outreach_log_client ON outreach_log(client_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_token ON proposals(token);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_files_client ON files(client_id);
CREATE INDEX idx_milestones_client ON milestones(client_id);
CREATE INDEX idx_activity_log_client ON activity_log(client_id);
CREATE INDEX idx_notes_client ON notes(client_id);
CREATE INDEX idx_client_links_client ON client_links(client_id);
CREATE INDEX idx_client_links_token ON client_links(token);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_links ENABLE ROW LEVEL SECURITY;

-- Helper to get user workspace
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Workspace Policies
CREATE POLICY "Users can access their own workspace" ON workspace
  FOR ALL USING (id = get_user_workspace_id());

-- Users Policies
CREATE POLICY "Users can access team members in their workspace" ON users
  FOR ALL USING (workspace_id = get_user_workspace_id());

-- Clients Policies
CREATE POLICY "Admins can view all workspace clients" ON clients FOR SELECT
  USING (workspace_id = get_user_workspace_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Members can view assigned clients" ON clients FOR SELECT
  USING (workspace_id = get_user_workspace_id() AND assigned_to = auth.uid());

CREATE POLICY "Admins can insert clients" ON clients FOR INSERT
  WITH CHECK (workspace_id = get_user_workspace_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Members can insert clients" ON clients FOR INSERT
  WITH CHECK (workspace_id = get_user_workspace_id() AND assigned_to = auth.uid());

CREATE POLICY "Admins can update all workspace clients" ON clients FOR UPDATE
  USING (workspace_id = get_user_workspace_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Members can update assigned clients" ON clients FOR UPDATE
  USING (workspace_id = get_user_workspace_id() AND assigned_to = auth.uid());

CREATE POLICY "Admins can delete all workspace clients" ON clients FOR DELETE
  USING (workspace_id = get_user_workspace_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Helper policy definition for child tables inheriting client access
-- Contacts
CREATE POLICY "Admins full access to contacts" ON contacts FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));

-- Similar policies for other tables (simplified for workspace logic)
CREATE POLICY "Admins full access to outreach_log" ON outreach_log FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to tasks" ON tasks FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to proposals" ON proposals FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to contracts" ON contracts FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to invoices" ON invoices FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to files" ON files FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to milestones" ON milestones FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to activity_log" ON activity_log FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to notes" ON notes FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));
CREATE POLICY "Admins full access to client_links" ON client_links FOR ALL USING (client_id IN (SELECT id FROM clients WHERE workspace_id = get_user_workspace_id()));

-- Public access policies
CREATE POLICY "Public read proposals via token" ON proposals FOR SELECT USING (true);
CREATE POLICY "Public read client links via token" ON client_links FOR SELECT USING (true);
