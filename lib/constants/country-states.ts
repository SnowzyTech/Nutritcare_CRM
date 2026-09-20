/**
 * Country → Region/State mapping — the single source of truth for every
 * country/state picker in the app.
 *
 * `COUNTRY_STATES` holds the data for every country we know about;
 * `COUNTRIES` is the subset currently open for business and is what drives
 * the pickers. To on-board a market, add its divisions here and list it in
 * `COUNTRIES`.
 *
 * Naming: each entry carries its administrative suffix ("Lagos State",
 * "Ashanti Region") because that is what the DB has been fed for years.
 * Older rows carry other spellings ("Lagos", "FCT Abuja", …) — compare with
 * `normalizeStateKey()` and query with `stateQueryVariants()` rather than
 * assuming the canonical form.
 */

export const COUNTRY_STATES = {
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
  // Retained for a future market — not selectable until Kenya is added to
  // COUNTRIES below.
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
} as const satisfies Record<string, readonly string[]>;

export type Country = keyof typeof COUNTRY_STATES;

/** Countries open for business — drives every country picker in the app. */
export const COUNTRIES = ["Nigeria", "Ghana"] as const satisfies readonly Country[];

export type ActiveCountry = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY: ActiveCountry = "Nigeria";

/** True when `value` is a country the UI currently offers. */
export function isSelectableCountry(value: string | null | undefined): value is ActiveCountry {
  return !!value && (COUNTRIES as readonly string[]).includes(value);
}

/**
 * Returns the list of states/regions for a country, or an empty array
 * if the country isn't in our mapping.
 */
export function getStatesForCountry(country: string): readonly string[] {
  return COUNTRY_STATES[country as Country] ?? [];
}

/**
 * `[{ country, states }]` — for the grouped filter dropdowns that let a
 * manager filter across both markets without picking a country first.
 */
export const STATE_OPTION_GROUPS: ReadonlyArray<{
  country: ActiveCountry;
  states: readonly string[];
}> = COUNTRIES.map((country) => ({ country, states: COUNTRY_STATES[country] }));

/** Every selectable state/region across all active countries, flattened. */
export const ALL_STATES: readonly string[] = STATE_OPTION_GROUPS.flatMap(
  (group) => group.states,
);

/* ──────────────────────────────────────────────────────────────────────────
   Legacy-spelling tolerance

   The DB was fed by a dozen independent hardcoded lists over time, so the same
   place is stored several ways — "Lagos State" / "Lagos" / "lagos", and the FCT
   in five spellings. Those rows are deliberately NOT rewritten, so anything
   that compares or queries by state has to tolerate them:

     • client-side predicates  → statesMatch()
     • Prisma where-clauses    → stateQueryVariants() + mode: "insensitive"
     • edit forms opening on a stored value → canonicalizeState() / countryForState()
   ────────────────────────────────────────────────────────────────────────── */

const FCT_KEY = "fct";

/** Every FCT spelling known to exist in the DB, canonical form first. */
const FCT_DB_SPELLINGS = [
  "Federal Capital Territory (FCT)",
  "FCT",
  "FCT Abuja",
  "FCT - Abuja",
  "Abuja (FCT)",
  "Abuja",
];

const FCT_ALIASES = new Set([
  "fct",
  "abuja",
  "fct abuja",
  "abuja fct",
  "federal capital territory",
  "federal capital territory fct",
]);

/**
 * Collapses every known spelling of a state to one comparison key, so
 * "Lagos State", "Lagos" and "lagos" all agree, as do the five FCT spellings.
 *
 * This is a comparison key only — never store it and never display it.
 * After suffix-stripping no Nigerian key collides with a Ghanaian one, so a
 * single flat keyspace across both countries is unambiguous.
 */
export function normalizeStateKey(value: string | null | undefined): string {
  if (!value) return "";
  const flattened = value
    .toLowerCase()
    .replace(/[().,\-_/]/g, " ") // "(FCT)" and "- Abuja" flatten to spaces
    .replace(/\s+/g, " ")
    .trim();
  if (!flattened) return "";
  if (FCT_ALIASES.has(flattened)) return FCT_KEY;
  const bare = flattened.replace(/ (state|region|county)$/, "");
  return FCT_ALIASES.has(bare) ? FCT_KEY : bare;
}

/** True when two state strings name the same place, whatever their spelling. */
export function statesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const key = normalizeStateKey(a);
  return key !== "" && key === normalizeStateKey(b);
}

const STATE_KEY_LOOKUP = new Map<string, { state: string; country: ActiveCountry }>(
  STATE_OPTION_GROUPS.flatMap((group) =>
    group.states.map(
      (state) =>
        [normalizeStateKey(state), { state, country: group.country }] as const,
    ),
  ),
);

/**
 * "Lagos" / "FCT Abuja" → "Lagos State" / "Federal Capital Territory (FCT)".
 * Returns null when the value matches no selectable state, so an edit form can
 * fall back to showing the raw stored value instead of silently blanking it.
 */
export function canonicalizeState(value: string | null | undefined): string | null {
  return STATE_KEY_LOOKUP.get(normalizeStateKey(value))?.state ?? null;
}

/** Which selectable country a stored state belongs to, or null if unknown. */
export function countryForState(
  value: string | null | undefined,
): ActiveCountry | null {
  return STATE_KEY_LOOKUP.get(normalizeStateKey(value))?.country ?? null;
}

/**
 * Every stored spelling to accept for a canonical state — for Prisma
 * `{ in: stateQueryVariants(s), mode: "insensitive" }`, where a client-side
 * normalizer can't reach. Lets DB-side filters find legacy rows without a
 * backfill. Always pair with `mode: "insensitive"`; case variants are not
 * included here.
 */
export function stateQueryVariants(canonical: string): string[] {
  const key = normalizeStateKey(canonical);
  if (!key) return [];
  if (key === FCT_KEY) return [...FCT_DB_SPELLINGS];

  const raw = canonical.trim().replace(/\s+/g, " ");
  const bare = raw.replace(/ (State|Region|County)$/i, "");
  return bare && bare !== raw ? [raw, bare] : [raw];
}
