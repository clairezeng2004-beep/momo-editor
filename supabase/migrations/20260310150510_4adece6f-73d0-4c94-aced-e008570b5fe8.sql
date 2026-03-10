
CREATE POLICY "Authenticated users can delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (true);
