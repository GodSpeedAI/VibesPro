-- Seed Data for Local Development
-- Provides sample data for testing and development
-- Run with: just db-seed

-- Insert sample users
INSERT INTO public.users (id, email, display_name, is_active, metadata)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'alice@example.com', 'Alice Developer', TRUE, '{"role": "admin", "tier": "pro"}'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'bob@example.com', 'Bob Builder', TRUE, '{"role": "member", "tier": "free"}'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'charlie@example.com', 'Charlie Coder', FALSE, '{"role": "member", "tier": "free"}')
ON CONFLICT (email) DO NOTHING;

-- Insert sample profiles
INSERT INTO public.profiles (user_id, bio, location, website_url, social_links, preferences)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Full-stack developer passionate about clean architecture', 'San Francisco, CA', 'https://alice.dev', '["https://github.com/alice", "https://twitter.com/alicedev"]', '{"theme": "dark", "notifications": true}'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Building the future one commit at a time', 'New York, NY', 'https://bob.codes', '["https://github.com/bob"]', '{"theme": "light", "notifications": false}')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample projects
INSERT INTO public.projects (id, owner_id, name, description, tags, status, visibility, settings)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'VibesPro Demo', 'A demonstration project for the VibesPro template', '{"demo", "template", "nx"}', 'active', 'public', '{"ci": true, "autoMerge": false}'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Private Project', 'Internal development project', '{"internal", "wip"}', 'draft', 'private', '{"ci": false}'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Bob''s API', 'REST API for Bob''s services', '{"api", "rest", "fastapi"}', 'active', 'team', '{"ci": true, "autoMerge": true}')
ON CONFLICT DO NOTHING;

-- Insert sample project members
INSERT INTO public.project_members (project_id, user_id, role)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'owner'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'member'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'owner'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin')
ON CONFLICT DO NOTHING;
