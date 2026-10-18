import { Country, State, City } from 'country-state-city';

export interface DistrictInfo {
  name: string;
  defaultZip?: string;
  majorCities?: string[];
}

export interface StateInfo {
  code: string;
  name: string;
  districts: DistrictInfo[];
}

export interface CountryInfo {
  code: string;
  name: string;
  flag?: string;
  phonecode?: string;
  currency?: string;
  states: StateInfo[];
}

export interface CityDetail {
  name: string;
  stateCode?: string;
  countryCode: string;
}

// Curated high-priority districts for major regions to preserve enhanced district UX
const CURATED_DISTRICTS: Record<string, Record<string, DistrictInfo[]>> = {
  US: {
    CA: [
      { name: 'Los Angeles County', defaultZip: '90001', majorCities: ['Los Angeles', 'Long Beach', 'Glendale', 'Pasadena', 'Santa Monica'] },
      { name: 'San Francisco County', defaultZip: '94102', majorCities: ['San Francisco'] },
      { name: 'Santa Clara County', defaultZip: '95113', majorCities: ['San Jose', 'Sunnyvale', 'Palo Alto', 'Santa Clara', 'Mountain View'] },
      { name: 'Orange County', defaultZip: '92801', majorCities: ['Anaheim', 'Irvine', 'Santa Ana', 'Huntington Beach', 'Newport Beach'] },
      { name: 'San Diego County', defaultZip: '92101', majorCities: ['San Diego', 'Chula Vista', 'Oceanside', 'Carlsbad'] },
      { name: 'Alameda County', defaultZip: '94601', majorCities: ['Oakland', 'Fremont', 'Berkeley', 'Hayward'] },
      { name: 'Sacramento County', defaultZip: '95814', majorCities: ['Sacramento', 'Elk Grove', 'Citrus Heights'] },
    ],
    NY: [
      { name: 'New York County (Manhattan)', defaultZip: '10001', majorCities: ['Manhattan', 'Midtown', 'Harlem', 'SoHo', 'Tribeca'] },
      { name: 'Kings County (Brooklyn)', defaultZip: '11201', majorCities: ['Brooklyn', 'Williamsburg', 'DUMBO', 'Flatbush'] },
      { name: 'Queens County', defaultZip: '11101', majorCities: ['Queens', 'Astoria', 'Flushing', 'Long Island City'] },
      { name: 'Bronx County', defaultZip: '10451', majorCities: ['Bronx', 'Riverdale'] },
      { name: 'Erie County', defaultZip: '14201', majorCities: ['Buffalo', 'Amherst', 'Cheektowaga'] },
      { name: 'Monroe County', defaultZip: '14604', majorCities: ['Rochester', 'Greece', 'Brighton'] },
      { name: 'Nassau County', defaultZip: '11501', majorCities: ['Hempstead', 'Garden City', 'Mineola'] },
    ],
    TX: [
      { name: 'Harris County (Houston)', defaultZip: '77002', majorCities: ['Houston', 'Pasadena', 'Baytown', 'Spring'] },
      { name: 'Travis County (Austin)', defaultZip: '78701', majorCities: ['Austin', 'Pflugerville', 'Lakeway'] },
      { name: 'Dallas County', defaultZip: '75201', majorCities: ['Dallas', 'Irving', 'Garland', 'Richardson'] },
      { name: 'Bexar County (San Antonio)', defaultZip: '78201', majorCities: ['San Antonio', 'Universal City'] },
      { name: 'Tarrant County (Fort Worth)', defaultZip: '76102', majorCities: ['Fort Worth', 'Arlington', 'Grapevine'] },
      { name: 'Collin County', defaultZip: '75024', majorCities: ['Plano', 'Frisco', 'McKinney', 'Allen'] },
    ],
    FL: [
      { name: 'Miami-Dade County', defaultZip: '33101', majorCities: ['Miami', 'Miami Beach', 'Coral Gables', 'Hialeah', 'Doral'] },
      { name: 'Broward County', defaultZip: '33301', majorCities: ['Fort Lauderdale', 'Hollywood', 'Pembroke Pines', 'Pompano Beach'] },
      { name: 'Orange County (Orlando)', defaultZip: '32801', majorCities: ['Orlando', 'Winter Park', 'Apopka'] },
      { name: 'Hillsborough County (Tampa)', defaultZip: '33602', majorCities: ['Tampa', 'Plant City', 'Brandon'] },
      { name: 'Palm Beach County', defaultZip: '33401', majorCities: ['West Palm Beach', 'Boca Raton', 'Delray Beach', 'Jupiter'] },
      { name: 'Duval County (Jacksonville)', defaultZip: '32202', majorCities: ['Jacksonville', 'Jacksonville Beach'] },
    ],
    IL: [
      { name: 'Cook County (Chicago)', defaultZip: '60601', majorCities: ['Chicago', 'Evanston', 'Oak Park', 'Schaumburg', 'Skokie'] },
      { name: 'DuPage County', defaultZip: '60187', majorCities: ['Naperville', 'Wheaton', 'Downers Grove', 'Elmhurst'] },
      { name: 'Lake County', defaultZip: '60085', majorCities: ['Waukegan', 'Highland Park', 'Libertyville'] },
      { name: 'Will County', defaultZip: '60432', majorCities: ['Joliet', 'Bolingbrook', 'Plainfield'] },
      { name: 'Kane County', defaultZip: '60134', majorCities: ['Aurora', 'Elgin', 'Geneva', 'St. Charles'] },
    ],
    OR: [
      { name: 'Lane County', defaultZip: '97477', majorCities: ['Springfield', 'Eugene', 'Cottage Grove', 'Florence'] },
      { name: 'Multnomah County', defaultZip: '97201', majorCities: ['Portland', 'Gresham', 'Troutdale'] },
      { name: 'Washington County', defaultZip: '97005', majorCities: ['Beaverton', 'Hillsboro', 'Tigard'] },
      { name: 'Clackamas County', defaultZip: '97045', majorCities: ['Oregon City', 'Lake Oswego', 'West Linn'] },
      { name: 'Marion County', defaultZip: '97301', majorCities: ['Salem', 'Keizer', 'Woodburn'] },
      { name: 'Deschutes County', defaultZip: '97701', majorCities: ['Bend', 'Redmond', 'Sisters'] },
    ],
    WA: [
      { name: 'King County (Seattle)', defaultZip: '98101', majorCities: ['Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Renton'] },
      { name: 'Pierce County (Tacoma)', defaultZip: '98402', majorCities: ['Tacoma', 'Lakewood', 'Puyallup'] },
      { name: 'Snohomish County (Everett)', defaultZip: '98201', majorCities: ['Everett', 'Lynnwood', 'Edmonds', 'Bothell'] },
      { name: 'Spokane County', defaultZip: '99201', majorCities: ['Spokane', 'Spokane Valley', 'Liberty Lake'] },
    ],
  },
  IN: {
    TN: [
      { name: 'Chennai District', defaultZip: '600001', majorCities: ['Chennai', 'T. Nagar', 'Adyar', 'Velachery', 'Anna Nagar'] },
      { name: 'Coimbatore District', defaultZip: '641001', majorCities: ['Coimbatore', 'Pollachi', 'Mettupalayam'] },
      { name: 'Madurai District', defaultZip: '625001', majorCities: ['Madurai', 'Melur', 'Thirumangalam'] },
      { name: 'Kanchipuram District', defaultZip: '631501', majorCities: ['Kanchipuram', 'Sriperumbudur'] },
      { name: 'Chengalpattu District', defaultZip: '603001', majorCities: ['Chengalpattu', 'Tambaram', 'Pallavaram', 'Mahabalipuram'] },
    ],
    MH: [
      { name: 'Mumbai City & Suburban', defaultZip: '400001', majorCities: ['Mumbai', 'Bandra', 'Andheri', 'Borivali', 'Dadar'] },
      { name: 'Pune District', defaultZip: '411001', majorCities: ['Pune', 'Pimpri-Chinchwad', 'Hinjawadi', 'Kothrud'] },
      { name: 'Thane District', defaultZip: '400601', majorCities: ['Thane', 'Navi Mumbai', 'Kalyan', 'Dombivli'] },
    ],
    KA: [
      { name: 'Bengaluru Urban', defaultZip: '560001', majorCities: ['Bengaluru', 'Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City'] },
      { name: 'Mysuru District', defaultZip: '570001', majorCities: ['Mysuru', 'Nanjangud', 'Hunsur'] },
    ],
    DL: [
      { name: 'New Delhi', defaultZip: '110001', majorCities: ['Connaught Place', 'Chanakyapuri', 'Barakhamba'] },
      { name: 'South Delhi', defaultZip: '110016', majorCities: ['Hauz Khas', 'Saket', 'Greater Kailash'] },
    ],
  },
  CA: {
    ON: [
      { name: 'Greater Toronto Area', defaultZip: 'M5V 2T6', majorCities: ['Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan'] },
      { name: 'Ottawa Region', defaultZip: 'K1P 1J1', majorCities: ['Ottawa', 'Nepean', 'Kanata', 'Orleans'] },
    ],
    BC: [
      { name: 'Metro Vancouver', defaultZip: 'V6B 1A1', majorCities: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Coquitlam'] },
    ],
  },
  GB: {
    ENG: [
      { name: 'Greater London', defaultZip: 'SW1A 1AA', majorCities: ['London', 'Westminster', 'Camden', 'Kensington', 'Greenwich'] },
      { name: 'Greater Manchester', defaultZip: 'M1 1AE', majorCities: ['Manchester', 'Salford', 'Bolton', 'Stockport'] },
      { name: 'West Midlands', defaultZip: 'B1 1AA', majorCities: ['Birmingham', 'Coventry', 'Wolverhampton', 'Solihull'] },
    ],
    SCT: [
      { name: 'City of Edinburgh', defaultZip: 'EH1 1YZ', majorCities: ['Edinburgh', 'Leith'] },
      { name: 'Glasgow City', defaultZip: 'G1 1DA', majorCities: ['Glasgow', 'West End', 'Southside'] },
    ],
  },
  AU: {
    NSW: [
      { name: 'Greater Sydney', defaultZip: '2000', majorCities: ['Sydney', 'Parramatta', 'Bondi', 'Manly', 'Chatswood'] },
    ],
    VIC: [
      { name: 'Greater Melbourne', defaultZip: '3000', majorCities: ['Melbourne', 'Richmond', 'St Kilda', 'Brunswick', 'South Yarra'] },
    ],
  },
};

// All 250 countries worldwide from standard ISO country dataset
export const COUNTRIES_DATA: CountryInfo[] = Country.getAllCountries().map((c) => ({
  code: c.isoCode,
  name: c.name,
  flag: c.flag,
  phonecode: c.phonecode,
  currency: c.currency,
  states: [],
}));

export function getAllCountries(): CountryInfo[] {
  return COUNTRIES_DATA;
}

export function getCountryByName(name: string): CountryInfo | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  return COUNTRIES_DATA.find(
    (c) => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
}

export function getStatesByCountryName(countryName: string): StateInfo[] {
  const country = getCountryByName(countryName) || getCountryByName('United States');
  if (!country) return [];
  const rawStates = State.getStatesOfCountry(country.code);
  return rawStates.map((s) => ({
    code: s.isoCode,
    name: s.name,
    districts: getDistrictsByState(country.code, s.isoCode),
  }));
}

export function getDistrictsByState(countryName: string, stateNameOrCode: string): DistrictInfo[] {
  const country = getCountryByName(countryName) || getCountryByName('United States');
  if (!country || !stateNameOrCode) return [];

  const cCode = country.code.toUpperCase();
  const states = State.getStatesOfCountry(cCode);
  const sQuery = stateNameOrCode.trim().toLowerCase();
  const matchedState = states.find(
    (s) => s.isoCode.toLowerCase() === sQuery || s.name.toLowerCase() === sQuery
  );
  const stateCode = (matchedState?.isoCode || stateNameOrCode).toUpperCase();

  const curated = CURATED_DISTRICTS[cCode]?.[stateCode];
  if (curated && curated.length > 0) {
    return curated;
  }

  return [];
}

/**
 * Returns all unique city names for a country and optional state.
 * Sorted alphabetically.
 */
export function getCitiesByCountryAndState(
  countryNameOrCode: string,
  stateNameOrCode?: string
): string[] {
  const country = getCountryByName(countryNameOrCode) || getCountryByName('United States');
  if (!country) return [];

  if (stateNameOrCode) {
    const states = State.getStatesOfCountry(country.code);
    const sQuery = stateNameOrCode.trim().toLowerCase();
    const matchingState = states.find(
      (s) => s.isoCode.toLowerCase() === sQuery || s.name.toLowerCase() === sQuery
    );

    if (matchingState) {
      const stateCities = City.getCitiesOfState(country.code, matchingState.isoCode);
      if (stateCities && stateCities.length > 0) {
        return Array.from(new Set(stateCities.map((c) => c.name))).sort((a, b) =>
          a.localeCompare(b)
        );
      }
    }
  }

  // Country-wide cities fallback
  const allCountryCities = City.getCitiesOfCountry(country.code) || [];
  return Array.from(new Set(allCountryCities.map((c) => c.name))).sort((a, b) =>
    a.localeCompare(b)
  );
}

/**
 * Returns detailed city objects with stateCode for smart state auto-selection.
 */
export function getDetailedCitiesByCountryAndState(
  countryNameOrCode: string,
  stateNameOrCode?: string
): CityDetail[] {
  const country = getCountryByName(countryNameOrCode) || getCountryByName('United States');
  if (!country) return [];

  if (stateNameOrCode) {
    const states = State.getStatesOfCountry(country.code);
    const sQuery = stateNameOrCode.trim().toLowerCase();
    const matchingState = states.find(
      (s) => s.isoCode.toLowerCase() === sQuery || s.name.toLowerCase() === sQuery
    );

    if (matchingState) {
      const stateCities = City.getCitiesOfState(country.code, matchingState.isoCode) || [];
      if (stateCities.length > 0) {
        const seen = new Set<string>();
        const list: CityDetail[] = [];
        for (const c of stateCities) {
          const key = c.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              name: c.name,
              stateCode: c.stateCode,
              countryCode: c.countryCode,
            });
          }
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
  }

  const allCountryCities = City.getCitiesOfCountry(country.code) || [];
  const seen = new Set<string>();
  const list: CityDetail[] = [];
  for (const c of allCountryCities) {
    const key = c.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push({
        name: c.name,
        stateCode: c.stateCode,
        countryCode: c.countryCode,
      });
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}
