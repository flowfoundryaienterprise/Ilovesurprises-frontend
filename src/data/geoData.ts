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
  states: StateInfo[];
}

export const COUNTRIES_DATA: CountryInfo[] = [
  {
    code: 'US',
    name: 'United States',
    states: [
      {
        code: 'CA',
        name: 'California',
        districts: [
          { name: 'Los Angeles County', defaultZip: '90001', majorCities: ['Los Angeles', 'Long Beach', 'Glendale', 'Pasadena', 'Santa Monica'] },
          { name: 'San Francisco County', defaultZip: '94102', majorCities: ['San Francisco'] },
          { name: 'Santa Clara County', defaultZip: '95113', majorCities: ['San Jose', 'Sunnyvale', 'Palo Alto', 'Santa Clara', 'Mountain View'] },
          { name: 'Orange County', defaultZip: '92801', majorCities: ['Anaheim', 'Irvine', 'Santa Ana', 'Huntington Beach', 'Newport Beach'] },
          { name: 'San Diego County', defaultZip: '92101', majorCities: ['San Diego', 'Chula Vista', 'Oceanside', 'Carlsbad'] },
          { name: 'Alameda County', defaultZip: '94601', majorCities: ['Oakland', 'Fremont', 'Berkeley', 'Hayward'] },
          { name: 'Sacramento County', defaultZip: '95814', majorCities: ['Sacramento', 'Elk Grove', 'Citrus Heights'] },
        ],
      },
      {
        code: 'NY',
        name: 'New York',
        districts: [
          { name: 'New York County (Manhattan)', defaultZip: '10001', majorCities: ['Manhattan', 'Midtown', 'Harlem', 'SoHo', 'Tribeca'] },
          { name: 'Kings County (Brooklyn)', defaultZip: '11201', majorCities: ['Brooklyn', 'Williamsburg', 'DUMBO', 'Flatbush'] },
          { name: 'Queens County', defaultZip: '11101', majorCities: ['Queens', 'Astoria', 'Flushing', 'Long Island City'] },
          { name: 'Bronx County', defaultZip: '10451', majorCities: ['Bronx', 'Riverdale'] },
          { name: 'Erie County', defaultZip: '14201', majorCities: ['Buffalo', 'Amherst', 'Cheektowaga'] },
          { name: 'Monroe County', defaultZip: '14604', majorCities: ['Rochester', 'Greece', 'Brighton'] },
          { name: 'Nassau County', defaultZip: '11501', majorCities: ['Hempstead', 'Garden City', 'Mineola'] },
        ],
      },
      {
        code: 'TX',
        name: 'Texas',
        districts: [
          { name: 'Harris County (Houston)', defaultZip: '77002', majorCities: ['Houston', 'Pasadena', 'Baytown', 'Spring'] },
          { name: 'Travis County (Austin)', defaultZip: '78701', majorCities: ['Austin', 'Pflugerville', 'Lakeway'] },
          { name: 'Dallas County', defaultZip: '75201', majorCities: ['Dallas', 'Irving', 'Garland', 'Richardson'] },
          { name: 'Bexar County (San Antonio)', defaultZip: '78201', majorCities: ['San Antonio', 'Universal City'] },
          { name: 'Tarrant County (Fort Worth)', defaultZip: '76102', majorCities: ['Fort Worth', 'Arlington', 'Grapevine'] },
          { name: 'Collin County', defaultZip: '75024', majorCities: ['Plano', 'Frisco', 'McKinney', 'Allen'] },
        ],
      },
      {
        code: 'FL',
        name: 'Florida',
        districts: [
          { name: 'Miami-Dade County', defaultZip: '33101', majorCities: ['Miami', 'Miami Beach', 'Coral Gables', 'Hialeah', 'Doral'] },
          { name: 'Broward County', defaultZip: '33301', majorCities: ['Fort Lauderdale', 'Hollywood', 'Pembroke Pines', 'Pompano Beach'] },
          { name: 'Orange County (Orlando)', defaultZip: '32801', majorCities: ['Orlando', 'Winter Park', 'Apopka'] },
          { name: 'Hillsborough County (Tampa)', defaultZip: '33602', majorCities: ['Tampa', 'Plant City', 'Brandon'] },
          { name: 'Palm Beach County', defaultZip: '33401', majorCities: ['West Palm Beach', 'Boca Raton', 'Delray Beach', 'Jupiter'] },
          { name: 'Duval County (Jacksonville)', defaultZip: '32202', majorCities: ['Jacksonville', 'Jacksonville Beach'] },
        ],
      },
      {
        code: 'IL',
        name: 'Illinois',
        districts: [
          { name: 'Cook County (Chicago)', defaultZip: '60601', majorCities: ['Chicago', 'Evanston', 'Oak Park', 'Schaumburg', 'Skokie'] },
          { name: 'DuPage County', defaultZip: '60187', majorCities: ['Naperville', 'Wheaton', 'Downers Grove', 'Elmhurst'] },
          { name: 'Lake County', defaultZip: '60085', majorCities: ['Waukegan', 'Highland Park', 'Libertyville'] },
          { name: 'Will County', defaultZip: '60432', majorCities: ['Joliet', 'Bolingbrook', 'Plainfield'] },
          { name: 'Kane County', defaultZip: '60134', majorCities: ['Aurora', 'Elgin', 'Geneva', 'St. Charles'] },
        ],
      },
      {
        code: 'OR',
        name: 'Oregon',
        districts: [
          { name: 'Lane County', defaultZip: '97477', majorCities: ['Springfield', 'Eugene', 'Cottage Grove', 'Florence'] },
          { name: 'Multnomah County', defaultZip: '97201', majorCities: ['Portland', 'Gresham', 'Troutdale'] },
          { name: 'Washington County', defaultZip: '97005', majorCities: ['Beaverton', 'Hillsboro', 'Tigard'] },
          { name: 'Clackamas County', defaultZip: '97045', majorCities: ['Oregon City', 'Lake Oswego', 'West Linn'] },
          { name: 'Marion County', defaultZip: '97301', majorCities: ['Salem', 'Keizer', 'Woodburn'] },
          { name: 'Deschutes County', defaultZip: '97701', majorCities: ['Bend', 'Redmond', 'Sisters'] },
        ],
      },
      {
        code: 'WA',
        name: 'Washington',
        districts: [
          { name: 'King County', defaultZip: '98101', majorCities: ['Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Renton'] },
          { name: 'Pierce County', defaultZip: '98402', majorCities: ['Tacoma', 'Puyallup', 'Lakewood'] },
          { name: 'Snohomish County', defaultZip: '98201', majorCities: ['Everett', 'Lynnwood', 'Edmonds'] },
          { name: 'Spokane County', defaultZip: '99201', majorCities: ['Spokane', 'Spokane Valley'] },
          { name: 'Clark County', defaultZip: '98660', majorCities: ['Vancouver', 'Camas'] },
        ],
      },
      {
        code: 'MA',
        name: 'Massachusetts',
        districts: [
          { name: 'Suffolk County (Boston)', defaultZip: '02108', majorCities: ['Boston', 'Chelsea', 'Revere', 'Winthrop'] },
          { name: 'Middlesex County', defaultZip: '02138', majorCities: ['Cambridge', 'Newton', 'Somerville', 'Framingham', 'Waltham'] },
          { name: 'Essex County', defaultZip: '01970', majorCities: ['Salem', 'Lynn', 'Lawrence', 'Peabody'] },
          { name: 'Norfolk County', defaultZip: '02445', majorCities: ['Brookline', 'Quincy', 'Braintree', 'Dedham'] },
        ],
      },
      {
        code: 'GA',
        name: 'Georgia',
        districts: [
          { name: 'Fulton County (Atlanta)', defaultZip: '30303', majorCities: ['Atlanta', 'Alpharetta', 'Roswell', 'Sandy Springs'] },
          { name: 'Gwinnett County', defaultZip: '30043', majorCities: ['Lawrenceville', 'Duluth', 'Norcross', 'Suwanee'] },
          { name: 'Cobb County', defaultZip: '30060', majorCities: ['Marietta', 'Smyrna', 'Kennesaw'] },
          { name: 'DeKalb County', defaultZip: '30030', majorCities: ['Decatur', 'Dunwoody', 'Stone Mountain'] },
        ],
      },
      {
        code: 'NC',
        name: 'North Carolina',
        districts: [
          { name: 'Mecklenburg County (Charlotte)', defaultZip: '28202', majorCities: ['Charlotte', 'Huntersville', 'Matthews'] },
          { name: 'Wake County (Raleigh)', defaultZip: '27601', majorCities: ['Raleigh', 'Cary', 'Apex', 'Wake Forest'] },
          { name: 'Durham County', defaultZip: '27701', majorCities: ['Durham'] },
          { name: 'Guilford County', defaultZip: '27401', majorCities: ['Greensboro', 'High Point'] },
        ],
      },
      {
        code: 'PA',
        name: 'Pennsylvania',
        districts: [
          { name: 'Philadelphia County', defaultZip: '19102', majorCities: ['Philadelphia', 'Center City', 'University City'] },
          { name: 'Allegheny County (Pittsburgh)', defaultZip: '15219', majorCities: ['Pittsburgh', 'Bethel Park', 'Monroeville'] },
          { name: 'Montgomery County', defaultZip: '19401', majorCities: ['Norristown', 'King of Prussia', 'Pottstown'] },
          { name: 'Bucks County', defaultZip: '18901', majorCities: ['Doylestown', 'Bensalem', 'Newtown'] },
        ],
      },
      {
        code: 'OH',
        name: 'Ohio',
        districts: [
          { name: 'Franklin County (Columbus)', defaultZip: '43215', majorCities: ['Columbus', 'Dublin', 'Gahanna', 'Westerville'] },
          { name: 'Cuyahoga County (Cleveland)', defaultZip: '44114', majorCities: ['Cleveland', 'Lakewood', 'Parma'] },
          { name: 'Hamilton County (Cincinnati)', defaultZip: '45202', majorCities: ['Cincinnati', 'Norwood', 'Blue Ash'] },
        ],
      },
      {
        code: 'MI',
        name: 'Michigan',
        districts: [
          { name: 'Wayne County (Detroit)', defaultZip: '48226', majorCities: ['Detroit', 'Dearborn', 'Livonia', 'Westland'] },
          { name: 'Oakland County', defaultZip: '48341', majorCities: ['Troy', 'Farmington Hills', 'Southfield', 'Pontiac'] },
          { name: 'Kent County (Grand Rapids)', defaultZip: '49503', majorCities: ['Grand Rapids', 'Wyoming', 'Kentwood'] },
        ],
      },
      {
        code: 'NJ',
        name: 'New Jersey',
        districts: [
          { name: 'Essex County (Newark)', defaultZip: '07102', majorCities: ['Newark', 'Montclair', 'East Orange'] },
          { name: 'Hudson County (Jersey City)', defaultZip: '07302', majorCities: ['Jersey City', 'Hoboken', 'Bayonne', 'Union City'] },
          { name: 'Bergen County', defaultZip: '07601', majorCities: ['Hackensack', 'Paramus', 'Fort Lee', 'Fair Lawn'] },
        ],
      },
      {
        code: 'CO',
        name: 'Colorado',
        districts: [
          { name: 'Denver County', defaultZip: '80202', majorCities: ['Denver'] },
          { name: 'El Paso County (Colorado Springs)', defaultZip: '80903', majorCities: ['Colorado Springs', 'Fountain'] },
          { name: 'Arapahoe County', defaultZip: '80120', majorCities: ['Aurora', 'Centennial', 'Littleton'] },
          { name: 'Boulder County', defaultZip: '80302', majorCities: ['Boulder', 'Longmont', 'Lafayette'] },
        ],
      },
      {
        code: 'AZ',
        name: 'Arizona',
        districts: [
          { name: 'Maricopa County (Phoenix)', defaultZip: '85003', majorCities: ['Phoenix', 'Scottsdale', 'Mesa', 'Chandler', 'Gilbert', 'Tempe'] },
          { name: 'Pima County (Tucson)', defaultZip: '85701', majorCities: ['Tucson', 'Marana', 'Oro Valley'] },
        ],
      },
      {
        code: 'NV',
        name: 'Nevada',
        districts: [
          { name: 'Clark County (Las Vegas)', defaultZip: '89101', majorCities: ['Las Vegas', 'Henderson', 'North Las Vegas', 'Paradise'] },
          { name: 'Washoe County (Reno)', defaultZip: '89501', majorCities: ['Reno', 'Sparks'] },
        ],
      },
      {
        code: 'VA',
        name: 'Virginia',
        districts: [
          { name: 'Fairfax County', defaultZip: '22030', majorCities: ['Fairfax', 'Reston', 'Herndon', 'McLean'] },
          { name: 'Arlington County', defaultZip: '22201', majorCities: ['Arlington'] },
          { name: 'Richmond City', defaultZip: '23219', majorCities: ['Richmond'] },
          { name: 'Virginia Beach City', defaultZip: '23456', majorCities: ['Virginia Beach'] },
        ],
      },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    states: [
      {
        code: 'TN',
        name: 'Tamil Nadu',
        districts: [
          { name: 'Chennai', defaultZip: '600001', majorCities: ['Chennai Central', 'T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
          { name: 'Coimbatore', defaultZip: '641001', majorCities: ['Coimbatore', 'Pollachi', 'Mettupalayam'] },
          { name: 'Madurai', defaultZip: '625001', majorCities: ['Madurai', 'Melur', 'Thirumangalam'] },
          { name: 'Salem', defaultZip: '636001', majorCities: ['Salem', 'Attur', 'Mettur'] },
          { name: 'Tiruchirappalli', defaultZip: '620001', majorCities: ['Trichy', 'Srirangam', 'Thuraiyur'] },
          { name: 'Tirunelveli', defaultZip: '627001', majorCities: ['Tirunelveli', 'Palayamkottai', 'Ambasamudram'] },
          { name: 'Erode', defaultZip: '638001', majorCities: ['Erode', 'Gobichettipalayam', 'Bhavani'] },
          { name: 'Kanchipuram', defaultZip: '631501', majorCities: ['Kanchipuram', 'Sriperumbudur'] },
          { name: 'Chengalpattu', defaultZip: '603001', majorCities: ['Chengalpattu', 'Tambaram', 'Mahabalipuram'] },
          { name: 'Vellore', defaultZip: '632001', majorCities: ['Vellore', 'Katpadi', 'Gudiyatham'] },
        ],
      },
      {
        code: 'KA',
        name: 'Karnataka',
        districts: [
          { name: 'Bengaluru Urban', defaultZip: '560001', majorCities: ['Bengaluru', 'Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar'] },
          { name: 'Bengaluru Rural', defaultZip: '562123', majorCities: ['Devanahalli', 'Nelamangala', 'Doddaballapur'] },
          { name: 'Mysuru', defaultZip: '570001', majorCities: ['Mysuru', 'Nanjangud', 'Hunsur'] },
          { name: 'Dakshina Kannada', defaultZip: '575001', majorCities: ['Mangaluru', 'Bantwal', 'Puttur'] },
          { name: 'Belagavi', defaultZip: '590001', majorCities: ['Belagavi', 'Gokak', 'Chikkodi'] },
          { name: 'Hubballi-Dharwad', defaultZip: '580020', majorCities: ['Hubballi', 'Dharwad'] },
        ],
      },
      {
        code: 'MH',
        name: 'Maharashtra',
        districts: [
          { name: 'Mumbai City', defaultZip: '400001', majorCities: ['South Mumbai', 'Colaba', 'Fort', 'Nariman Point'] },
          { name: 'Mumbai Suburban', defaultZip: '400050', majorCities: ['Bandra', 'Andheri', 'Borivali', 'Juhu', 'Powai'] },
          { name: 'Pune', defaultZip: '411001', majorCities: ['Pune', 'Pimpri-Chinchwad', 'Hinjawadi', 'Kothrud'] },
          { name: 'Thane', defaultZip: '400601', majorCities: ['Thane', 'Kalyan', 'Navi Mumbai', 'Dombivli'] },
          { name: 'Nagpur', defaultZip: '440001', majorCities: ['Nagpur', 'Kamptee', 'Hingna'] },
          { name: 'Nashik', defaultZip: '422001', majorCities: ['Nashik', 'Deolali', 'Sinnar'] },
        ],
      },
      {
        code: 'DL',
        name: 'Delhi NCR',
        districts: [
          { name: 'New Delhi', defaultZip: '110001', majorCities: ['Connaught Place', 'Chanakyapuri', 'Barakhamba'] },
          { name: 'South Delhi', defaultZip: '110016', majorCities: ['Hauz Khas', 'Saket', 'Greater Kailash', 'Vasant Kunj'] },
          { name: 'Gurugram (NCR)', defaultZip: '122001', majorCities: ['Cyber City', 'Golf Course Rd', 'Sohna Rd'] },
          { name: 'Noida (NCR)', defaultZip: '201301', majorCities: ['Sector 18', 'Sector 62', 'Greater Noida'] },
          { name: 'North Delhi', defaultZip: '110007', majorCities: ['Civil Lines', 'Model Town', 'Rohini'] },
        ],
      },
      {
        code: 'KL',
        name: 'Kerala',
        districts: [
          { name: 'Ernakulam (Kochi)', defaultZip: '682001', majorCities: ['Kochi', 'Kakkanad', 'Aluva', 'Fort Kochi'] },
          { name: 'Thiruvananthapuram', defaultZip: '695001', majorCities: ['Trivandrum', 'Technopark', 'Kazhakoottam'] },
          { name: 'Kozhikode (Calicut)', defaultZip: '673001', majorCities: ['Kozhikode', 'Vatakara', 'Beypore'] },
          { name: 'Thrissur', defaultZip: '680001', majorCities: ['Thrissur', 'Chalakudy', 'Guruvayur'] },
        ],
      },
      {
        code: 'TS',
        name: 'Telangana',
        districts: [
          { name: 'Hyderabad', defaultZip: '500001', majorCities: ['Hyderabad', 'HITEC City', 'Gachibowli', 'Banjara Hills', 'Jubilee Hills'] },
          { name: 'Medchal-Malkajgiri', defaultZip: '500047', majorCities: ['Secunderabad', 'Kukatpally', 'Malkajgiri'] },
          { name: 'Rangareddy', defaultZip: '500030', majorCities: ['Rajendranagar', 'Shamshabad', 'Serilingampally'] },
        ],
      },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    states: [
      {
        code: 'ON',
        name: 'Ontario',
        districts: [
          { name: 'Toronto Division', defaultZip: 'M5H 2N2', majorCities: ['Toronto', 'Downtown', 'North York', 'Scarborough'] },
          { name: 'Peel Region', defaultZip: 'L5B 1M3', majorCities: ['Mississauga', 'Brampton', 'Caledon'] },
          { name: 'York Region', defaultZip: 'L4B 1A1', majorCities: ['Markham', 'Vaughan', 'Richmond Hill'] },
          { name: 'Ottawa Division', defaultZip: 'K1P 1J1', majorCities: ['Ottawa', 'Kanata', 'Nepean'] },
          { name: 'Halton Region', defaultZip: 'L6M 3L1', majorCities: ['Oakville', 'Burlington', 'Milton'] },
        ],
      },
      {
        code: 'BC',
        name: 'British Columbia',
        districts: [
          { name: 'Metro Vancouver', defaultZip: 'V6B 1A1', majorCities: ['Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Coquitlam'] },
          { name: 'Capital Regional (Victoria)', defaultZip: 'V8W 1P6', majorCities: ['Victoria', 'Saanich', 'Langford'] },
          { name: 'Fraser Valley', defaultZip: 'V2S 1M3', majorCities: ['Abbotsford', 'Chilliwack', 'Mission'] },
        ],
      },
      {
        code: 'QC',
        name: 'Quebec',
        districts: [
          { name: 'Montreal Region', defaultZip: 'H2Y 1C6', majorCities: ['Montreal', 'Westmount', 'Laval'] },
          { name: 'Capitale-Nationale (Quebec City)', defaultZip: 'G1R 4P5', majorCities: ['Quebec City', 'Levis'] },
        ],
      },
      {
        code: 'AB',
        name: 'Alberta',
        districts: [
          { name: 'Calgary Metropolitan Region', defaultZip: 'T2P 1J9', majorCities: ['Calgary', 'Airdrie', 'Cochrane'] },
          { name: 'Edmonton Metropolitan Region', defaultZip: 'T5J 0N3', majorCities: ['Edmonton', 'St. Albert', 'Sherwood Park'] },
        ],
      },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    states: [
      {
        code: 'ENG',
        name: 'England',
        districts: [
          { name: 'Greater London', defaultZip: 'SW1A 1AA', majorCities: ['City of London', 'Westminster', 'Camden', 'Kensington', 'Islington'] },
          { name: 'Greater Manchester', defaultZip: 'M1 1AE', majorCities: ['Manchester', 'Salford', 'Bolton', 'Stockport'] },
          { name: 'West Midlands', defaultZip: 'B1 1AA', majorCities: ['Birmingham', 'Coventry', 'Wolverhampton', 'Solihull'] },
          { name: 'West Yorkshire', defaultZip: 'LS1 1UR', majorCities: ['Leeds', 'Bradford', 'Wakefield', 'Huddersfield'] },
          { name: 'Merseyside', defaultZip: 'L1 8JQ', majorCities: ['Liverpool', 'Birkenhead', 'St Helens'] },
        ],
      },
      {
        code: 'SCT',
        name: 'Scotland',
        districts: [
          { name: 'City of Edinburgh', defaultZip: 'EH1 1YZ', majorCities: ['Edinburgh', 'Leith'] },
          { name: 'Glasgow City', defaultZip: 'G1 1DA', majorCities: ['Glasgow', 'West End', 'Southside'] },
        ],
      },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    states: [
      {
        code: 'NSW',
        name: 'New South Wales',
        districts: [
          { name: 'Greater Sydney', defaultZip: '2000', majorCities: ['Sydney CBD', 'Parramatta', 'Bondi', 'Manly', 'Chatswood'] },
          { name: 'Hunter Region', defaultZip: '2300', majorCities: ['Newcastle', 'Maitland'] },
          { name: 'Illawarra', defaultZip: '2500', majorCities: ['Wollongong', 'Shellharbour'] },
        ],
      },
      {
        code: 'VIC',
        name: 'Victoria',
        districts: [
          { name: 'Greater Melbourne', defaultZip: '3000', majorCities: ['Melbourne CBD', 'Richmond', 'St Kilda', 'Brunswick', 'South Yarra'] },
          { name: 'Geelong Region', defaultZip: '3220', majorCities: ['Geelong', 'Torquay'] },
        ],
      },
      {
        code: 'QLD',
        name: 'Queensland',
        districts: [
          { name: 'Greater Brisbane', defaultZip: '4000', majorCities: ['Brisbane CBD', 'Fortitude Valley', 'South Bank'] },
          { name: 'Gold Coast Region', defaultZip: '4217', majorCities: ['Surfers Paradise', 'Broadbeach', 'Robina'] },
        ],
      },
    ],
  },
];

// Helper functions for easy lookup
export function getCountryByName(name: string): CountryInfo | undefined {
  return COUNTRIES_DATA.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() || c.code.toLowerCase() === name.toLowerCase()
  );
}

export function getStatesByCountryName(countryName: string): StateInfo[] {
  const country = getCountryByName(countryName) || COUNTRIES_DATA[0];
  return country.states;
}

export function getDistrictsByState(countryName: string, stateNameOrCode: string): DistrictInfo[] {
  const states = getStatesByCountryName(countryName);
  const state = states.find(
    (s) =>
      s.code.toLowerCase() === stateNameOrCode.toLowerCase() ||
      s.name.toLowerCase() === stateNameOrCode.toLowerCase()
  );
  return state?.districts || (states[0]?.districts ?? []);
}
