export interface BrandConfig {
  app_name: string;
  app_description: string;
  logo_url: string;
  favicon_url: string;
  login_subtitle: string;
  register_subtitle: string;
}

export interface PublicConfig {
  brand: BrandConfig;
}
