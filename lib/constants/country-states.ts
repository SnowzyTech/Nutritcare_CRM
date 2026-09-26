/**
 * Country → Region/State mapping used by delivery-agent forms.
 *
 * Each entry lists the administrative divisions relevant to the business.
 * Extend as new countries are on-boarded.
 */

export const COUNTRIES = ["Nigeria", "Ghana", "Kenya"] as const;

export type Country = (typeof COUNTRIES)[number];

export const COUNTRY_STATES: Record<Country, string[]> = {
  Nigeria: [
    "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State",
    "Bauchi State", "Bayelsa State", "Benue State", "Borno State",
    "Cross River State", "Delta State", "Ebonyi State", "Edo State",
    "Ekiti State", "Enugu State", "Gombe State", "Imo State",
    "Jigawa State", "Kaduna State", "Kano State", "Katsina State",
    "Kebbi State", "Kogi State", "Kwara State", "Lagos State",
    "Nasarawa State", "Niger State", "Ogun State", "Ondo State",
    "Osun State", "Oyo State", "Plateau State", "Rivers State",
    "Sokoto State", "Taraba State", "Yobe State", "Zamfara State",
    "Federal Capital Territory (FCT)",
  ],
  Ghana: [
    "Ahafo Region", "Ashanti Region", "Bono Region", "Bono East Region",
    "Central Region", "Eastern Region", "Greater Accra Region",
    "North East Region", "Northern Region", "Oti Region",
    "Savannah Region", "Upper East Region", "Upper West Region",
    "Volta Region", "Western Region", "Western North Region",
  ],
  Kenya: [
    "Baringo County", "Bomet County", "Bungoma County", "Busia County",
    "Elgeyo-Marakwet County", "Embu County", "Garissa County",
    "Homa Bay County", "Isiolo County", "Kajiado County", "Kakamega County",
    "Kericho County", "Kiambu County", "Kilifi County", "Kirinyaga County",
    "Kisii County", "Kisumu County", "Kitui County", "Kwale County",
    "Laikipia County", "Lamu County", "Machakos County", "Makueni County",
    "Mandera County", "Marsabit County", "Meru County", "Migori County",
    "Mombasa County", "Murang'a County", "Nairobi County", "Nakuru County",
    "Nandi County", "Narok County", "Nyamira County", "Nyandarua County",
    "Nyeri County", "Samburu County", "Siaya County", "Taita-Taveta County",
    "Tana River County", "Tharaka-Nithi County", "Trans-Nzoia County",
    "Turkana County", "Uasin Gishu County", "Vihiga County",
    "Wajir County", "West Pokot County",
  ],
};

/**
 * Returns the list of states/regions for a country, or an empty array
 * if the country isn't in our mapping.
 */
export function getStatesForCountry(country: string): string[] {
  return COUNTRY_STATES[country as Country] ?? [];
}
