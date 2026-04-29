-- Add quotes field to fatwa_responses
-- Migration: 20240106000000_fatwa_response_references.sql

ALTER TABLE public.fatwa_responses
  ADD COLUMN IF NOT EXISTS quotes text;  -- Quranic verses, Hadith, scholarly sources
