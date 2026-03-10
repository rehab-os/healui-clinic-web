export enum AvailabilityType {
  CLINIC = 'CLINIC',
  HOME_VISIT = 'HOME_VISIT',
  ONLINE = 'ONLINE',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// New coordinate-based zone configuration
export interface CoordinateZoneConfig {
  green_radius_km: number
  yellow_radius_km: number
  red_radius_km: number
  yellow_travel_charge: number
  red_travel_charge: number
}

// New ServiceArea entity (coordinate-based)
export interface ServiceArea {
  id: string
  physiotherapist_id: string
  name: string
  latitude: number
  longitude: number
  zone_config: CoordinateZoneConfig
  base_address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Legacy - keeping for backward compatibility during transition
export interface ZoneConfig {
  pincodes: string[]
  radius_km: number
  extra_charge?: number
}

export interface ServiceZoneConfig {
  green: ZoneConfig
  yellow: ZoneConfig & { extra_charge: number }
  red: ZoneConfig & { extra_charge: number }
}

export interface PhysioServiceLocation {
  id: string
  physiotherapist_id: string
  location_name: string
  base_address: string
  base_pincode: string
  latitude: number
  longitude: number
  service_pincodes: string[]
  zone_config: ServiceZoneConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PhysiotherapistAvailability {
  id: string
  physiotherapist_id: string
  availability_type: AvailabilityType
  clinic_id?: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  slot_duration_minutes: number
  service_pincodes?: string[]
  max_radius_km?: number
  service_location_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  serviceLocation?: PhysioServiceLocation
}

export interface AvailableSlot {
  availability_id: string
  clinic_id?: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
}

export interface PracticeSettings {
  id?: string
  online_consultation_available?: boolean
  home_visit_available?: boolean
  marketplace_active?: boolean
  profile_completed_at?: string
  updated_at?: string
  consultation_fee?: number
  home_visit_fee?: number
}
