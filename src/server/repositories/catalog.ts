import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type {
  Branch,
  Employee,
  GalleryItem,
  Review,
  Service,
  ServiceCategory,
} from '@/types/domain';

export interface PublicCatalogData {
  configured: boolean;
  branches: Branch[];
  categories: ServiceCategory[];
  services: Service[];
  masters: Employee[];
  reviews: Review[];
  gallery: GalleryItem[];
  branchServices: Array<{ branch_id: string; service_id: string; price_override_kzt: number | null }>;
  employeeServices: Array<{ employee_id: string; service_id: string }>;
}

async function fetchPublicCatalogUncached(): Promise<PublicCatalogData> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      configured: false,
      branches: [],
      categories: [],
      services: [],
      masters: [],
      reviews: [],
      gallery: [],
      branchServices: [],
      employeeServices: [],
    };
  }

  const [
    branchesRes,
    categoriesRes,
    servicesRes,
    mastersRes,
    reviewsRes,
    galleryRes,
    bsRes,
    esRes,
  ] = await Promise.all([
    admin
      .from('branches')
      .select(
        'id, slug, name, address, is_verified_address, phone, whatsapp_phone, instagram_url, working_hours, latitude, longitude, map_url, interior_photos, is_active, sort_order'
      )
      .eq('is_active', true)
      .order('sort_order'),
    admin
      .from('service_categories')
      .select('id, slug, name_i18n, description_i18n, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order'),
    admin
      .from('services')
      .select(
        'id, category_id, slug, name_i18n, description_i18n, price_kzt, is_price_verified, duration_minutes, photo_url, is_placeholder_photo, is_popular, is_active, archived_at'
      )
      .eq('is_active', true)
      .is('archived_at', null),
    admin
      .from('employees')
      .select(
        'id, profile_id, branch_id, full_name, specialization_i18n, bio_i18n, experience_years, experience_verified, photo_url, is_placeholder_photo, portfolio_urls, is_master, is_active'
      )
      .eq('is_active', true)
      .eq('is_master', true),
    admin
      .from('reviews')
      .select('id, branch_id, author_name, source_name, external_url, content_i18n, is_verified, is_published')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(24),
    admin
      .from('gallery_items')
      .select('id, branch_id, employee_id, category_id, image_url, caption_i18n, is_placeholder, is_published, sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .limit(60),
    admin
      .from('branch_services')
      .select('branch_id, service_id, price_override_kzt')
      .eq('is_active', true),
    admin.from('employee_services').select('employee_id, service_id'),
  ]);

  return {
    configured: true,
    branches: (branchesRes.data ?? []) as Branch[],
    categories: (categoriesRes.data ?? []) as ServiceCategory[],
    services: (servicesRes.data ?? []) as Service[],
    masters: (mastersRes.data ?? []) as Employee[],
    reviews: (reviewsRes.data ?? []) as Review[],
    gallery: (galleryRes.data ?? []) as GalleryItem[],
    branchServices: (bsRes.data ?? []) as Array<{
      branch_id: string;
      service_id: string;
      price_override_kzt: number | null;
    }>,
    employeeServices: (esRes.data ?? []) as Array<{ employee_id: string; service_id: string }>,
  };
}

const getCachedCatalog = unstable_cache(fetchPublicCatalogUncached, ['public-catalog-v1'], {
  revalidate: 60,
  tags: ['catalog'],
});

/**
 * Per-request deduplicated + cross-request ISR-cached (60s) catalog loader.
 * Invalidated via revalidateTag('catalog') when CRM updates branches/services/masters.
 */
export const getPublicCatalogData = cache(async (): Promise<PublicCatalogData> => {
  return getCachedCatalog();
});
