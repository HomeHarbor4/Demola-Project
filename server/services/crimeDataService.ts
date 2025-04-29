import { db } from '../db';
import { crime_data } from '@shared/schema';
import axios from 'axios';
import { CronJob } from 'cron';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import pRetry from 'p-retry';

interface CrimeDataResponse {
    version: string;
    class: string;
    label: string;
    source: string;
    updated: string;
    note: string[];
    role: {
        time: string[];
        metric: string[];
    };
    id: string[];
    size: number[];
    dimension: {
        Kuukausi: {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
            };
        };
        Kunta: {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
            };
        };
        'Rikosryhmä ja teonkuvauksen tarkenne': {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
            };
        };
        Tiedot: {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
            };
        };
    };
    value: (number | string | null)[];
}

interface TableStructureResponse {
    id: string;
    type: string;
    text: string;
    variables: Array<{
        code: string;
        text: string;
        values: string[];
        valueTexts: string[];
    }>;
}

export class CrimeDataService {
    private static readonly API_URL = 'https://pxdata.stat.fi:443/PxWeb/api/v1/en/StatFin/rpk/statfin_rpk_pxt_13it.px';
    private static readonly UPDATE_CRON = '0 0 * * *'; // Run once every 24 hours at midnight
    private static readonly BATCH_SIZE = 500; // Reduced batch size
    private static readonly CONCURRENCY = 1; // Process one query at a time
    private static readonly RETRY_ATTEMPTS = 3;
    private static readonly RETRY_DELAY = 1000; // 1 second delay between retries
    private static readonly RATE_LIMIT_DELAY = 100; // 100ms delay between API calls

    private static readonly QUERIES = [
        `{
  "query": [
    {
      "code": "Kuukausi",
      "selection": {
        "filter": "item",
        "values": [
          "2024M12",
          "2025M01",
          "2025M02",
          "2025M03"
        ]
      }
    },
    {
      "code": "Kunta",
      "selection": {
        "filter": "agg:_Municipalities in numerical order 2025.agg",
        "values": [
          "SSS"
        ]
      }
    },
    {
      "code": "Rikosryhmä ja teonkuvauksen tarkenne",
      "selection": {
        "filter": "item",
        "values": [
          "101T603",
          "101T504X406",
          "101T161",
          "101T103",
          "101",
          "102",
          "103",
          "101T103a0108",
          "101T103a0107",
          "101T103a0101",
          "101T103a0102",
          "101T103a0103",
          "101T103a0104",
          "101T103a0105",
          "101T103a0106",
          "111",
          "112",
          "113",
          "114",
          "114a0201",
          "115",
          "115a0301",
          "116",
          "117",
          "121T122",
          "121",
          "122",
          "121T122a1701",
          "121T122a1702",
          "121T122a1703",
          "121T122a1704",
          "121T122a1706",
          "121T122a1705",
          "121T122a17XX",
          "123",
          "131T132",
          "131",
          "132",
          "131T132a1701",
          "131T132a1702",
          "131T132a1703",
          "131T132a1704",
          "131T132a1706",
          "131T132a1705",
          "131T132a17XX",
          "133",
          "133a9999",
          "134",
          "134a9999",
          "135",
          "136",
          "141",
          "142",
          "143",
          "143a0499",
          "144",
          "144a0499",
          "143T144a0401",
          "145",
          "146",
          "151",
          "152",
          "153",
          "154",
          "155",
          "156",
          "157",
          "158",
          "159",
          "158T159a0501",
          "160",
          "161",
          "201T223",
          "201_202_205",
          "201",
          "202",
          "205",
          "201_202_205a1701",
          "201_202_205a1702",
          "201_202_205a1703",
          "201_202_205a1704",
          "201_202_205a1706",
          "201_202_205a1705",
          "201_202_205a17XX",
          "203",
          "203a1701",
          "203a1702",
          "203a1703",
          "203a1704",
          "203a1706",
          "203a1705",
          "203a17XX",
          "204",
          "211T213",
          "211",
          "212",
          "213",
          "211T213a1701",
          "211T213a1702",
          "211T213a1703",
          "211T213a1704",
          "211T213a1706",
          "211T213a1705",
          "211T213a17XX",
          "206",
          "221",
          "221a0601",
          "221a0602",
          "221a0603",
          "221a0604",
          "221a0699",
          "222",
          "222a0701",
          "222a0702",
          "222a0703",
          "222a0704",
          "222a0799",
          "223",
          "231T241",
          "231",
          "232",
          "232a1701",
          "232a1702",
          "232a1703",
          "232a1704",
          "232a1706",
          "232a1705",
          "232a17XX",
          "233",
          "234",
          "234a1701",
          "234a1702",
          "234a1703",
          "234a1704",
          "234a1706",
          "234a1705",
          "234a17XX",
          "235",
          "236",
          "236a1707",
          "237",
          "237a1707",
          "238",
          "239",
          "240",
          "240a1707",
          "241",
          "241a1707",
          "301T321",
          "301",
          "301a0801",
          "302",
          "302a0901",
          "311",
          "312",
          "313",
          "321",
          "331_332_501T504",
          "501",
          "501a1001",
          "502",
          "502a1101",
          "331T332",
          "331T332a2101",
          "331T332a2102",
          "331T332a2103",
          "331",
          "331a2101",
          "331a2102",
          "331a2103",
          "332",
          "332a2101",
          "332a2102",
          "332a2103",
          "333",
          "334",
          "503",
          "504",
          "322_323_341T458X406",
          "341",
          "351",
          "352",
          "323",
          "365",
          "355",
          "357",
          "359",
          "322",
          "451_452_456T458",
          "451",
          "452",
          "456",
          "457",
          "458",
          "361",
          "407",
          "408",
          "409",
          "406_505_601T603",
          "406",
          "505",
          "505a1201",
          "505a2501",
          "505a2502",
          "505a1205",
          "601",
          "602",
          "600",
          "603"
        ]
      }
    }
  ],
  "response": {
    "format": "json-stat2"
  }
}`,
        `{
  "query": [
    {
      "code": "Kuukausi",
      "selection": {
        "filter": "item",
        "values": [
          "2024M12",
          "2025M01",
          "2025M02",
          "2025M03"
        ]
      }
    },
    {
      "code": "Kunta",
      "selection": {
        "filter": "agg:_Municipalities in numerical order 2025.agg",
        "values": [
          "KU005",
          "KU009",
          "KU010",
          "KU016",
          "KU018",
          "KU019",
          "KU020",
          "KU035",
          "KU043",
          "KU046",
          "KU047",
          "KU049",
          "KU050",
          "KU051",
          "KU052",
          "KU060",
          "KU061",
          "KU062",
          "KU065",
          "KU069",
          "KU071",
          "KU072",
          "KU074",
          "KU075",
          "KU076",
          "KU077",
          "KU078",
          "KU079",
          "KU081",
          "KU082",
          "KU086",
          "KU090",
          "KU091",
          "KU092",
          "KU097",
          "KU098",
          "KU102",
          "KU103",
          "KU105",
          "KU106",
          "KU108",
          "KU109",
          "KU111",
          "KU139",
          "KU140",
          "KU142",
          "KU143",
          "KU145",
          "KU146",
          "KU148",
          "KU149",
          "KU151",
          "KU152",
          "KU153",
          "KU165",
          "KU167",
          "KU169",
          "KU170",
          "KU171",
          "KU172",
          "KU176",
          "KU177",
          "KU178",
          "KU179",
          "KU181",
          "KU182",
          "KU186",
          "KU202",
          "KU204",
          "KU205",
          "KU208",
          "KU211",
          "KU213",
          "KU214",
          "KU216",
          "KU217",
          "KU218",
          "KU224",
          "KU226",
          "KU230",
          "KU231",
          "KU232",
          "KU233",
          "KU235",
          "KU236",
          "KU239",
          "KU240",
          "KU241",
          "KU244",
          "KU245",
          "KU249",
          "KU250",
          "KU256",
          "KU257",
          "KU260",
          "KU261",
          "KU263",
          "KU265",
          "KU271",
          "KU272"
        ]
      }
    },
    {
      "code": "Rikosryhmä ja teonkuvauksen tarkenne",
      "selection": {
        "filter": "item",
        "values": [
          "101T603",
          "101T504X406",
          "101T161",
          "101T103",
          "101",
          "102",
          "103",
          "101T103a0108",
          "101T103a0107",
          "101T103a0101",
          "101T103a0102",
          "101T103a0103",
          "101T103a0104",
          "101T103a0105",
          "101T103a0106",
          "111",
          "112",
          "113",
          "114",
          "114a0201",
          "115",
          "115a0301",
          "116",
          "117",
          "121T122",
          "121",
          "122",
          "121T122a1701",
          "121T122a1702",
          "121T122a1703",
          "121T122a1704",
          "121T122a1706",
          "121T122a1705",
          "121T122a17XX",
          "123",
          "131T132",
          "131",
          "132",
          "131T132a1701",
          "131T132a1702",
          "131T132a1703",
          "131T132a1704",
          "131T132a1706",
          "131T132a1705",
          "131T132a17XX",
          "133",
          "133a9999",
          "134",
          "134a9999",
          "135",
          "136",
          "141",
          "142",
          "143",
          "143a0499",
          "144",
          "144a0499",
          "143T144a0401",
          "145",
          "146",
          "151",
          "152",
          "153",
          "154",
          "155",
          "156",
          "157",
          "158",
          "159",
          "158T159a0501",
          "160",
          "161",
          "201T223",
          "201_202_205",
          "201",
          "202",
          "205",
          "201_202_205a1701",
          "201_202_205a1702",
          "201_202_205a1703",
          "201_202_205a1704",
          "201_202_205a1706",
          "201_202_205a1705",
          "201_202_205a17XX",
          "203",
          "203a1701",
          "203a1702",
          "203a1703",
          "203a1704",
          "203a1706",
          "203a1705",
          "203a17XX",
          "204",
          "211T213",
          "211",
          "212",
          "213",
          "211T213a1701",
          "211T213a1702",
          "211T213a1703",
          "211T213a1704",
          "211T213a1706",
          "211T213a1705",
          "211T213a17XX",
          "206",
          "221",
          "221a0601",
          "221a0602",
          "221a0603",
          "221a0604",
          "221a0699",
          "222",
          "222a0701",
          "222a0702",
          "222a0703",
          "222a0704",
          "222a0799",
          "223",
          "231T241",
          "231",
          "232",
          "232a1701",
          "232a1702",
          "232a1703",
          "232a1704",
          "232a1706",
          "232a1705",
          "232a17XX",
          "233",
          "234",
          "234a1701",
          "234a1702",
          "234a1703",
          "234a1704",
          "234a1706",
          "234a1705",
          "234a17XX",
          "235",
          "236",
          "236a1707",
          "237",
          "237a1707",
          "238",
          "239",
          "240",
          "240a1707",
          "241",
          "241a1707",
          "301T321",
          "301",
          "301a0801",
          "302",
          "302a0901",
          "311",
          "312",
          "313",
          "321",
          "331_332_501T504",
          "501",
          "501a1001",
          "502",
          "502a1101",
          "331T332",
          "331T332a2101",
          "331T332a2102",
          "331T332a2103",
          "331",
          "331a2101",
          "331a2102",
          "331a2103",
          "332",
          "332a2101",
          "332a2102",
          "332a2103",
          "333",
          "334",
          "503",
          "504",
          "322_323_341T458X406",
          "341",
          "351",
          "352",
          "323",
          "365",
          "355",
          "357",
          "359",
          "322",
          "451_452_456T458",
          "451",
          "452",
          "456",
          "457",
          "458",
          "361",
          "407",
          "408",
          "409",
          "406_505_601T603",
          "406",
          "505",
          "505a1201",
          "505a2501",
          "505a2502",
          "505a1205",
          "601",
          "602",
          "600",
          "603"
        ]
      }
    }
  ],
  "response": {
    "format": "json-stat2"
  }
}`, 
`{
  "query": [
    {
      "code": "Kuukausi",
      "selection": {
        "filter": "item",
        "values": [
          "2024M12",
          "2025M01",
          "2025M02",
          "2025M03"
        ]
      }
    },
    {
      "code": "Kunta",
      "selection": {
        "filter": "agg:_Municipalities in numerical order 2025.agg",
        "values": [
          "KU273",
          "KU275",
          "KU276",
          "KU280",
          "KU284",
          "KU285",
          "KU286",
          "KU287",
          "KU288",
          "KU290",
          "KU291",
          "KU295",
          "KU297",
          "KU300",
          "KU301",
          "KU304",
          "KU305",
          "KU309",
          "KU312",
          "KU316",
          "KU317",
          "KU318",
          "KU320",
          "KU322",
          "KU398",
          "KU399",
          "KU400",
          "KU402",
          "KU403",
          "KU405",
          "KU407",
          "KU408",
          "KU410",
          "KU416",
          "KU417",
          "KU418",
          "KU420",
          "KU421",
          "KU422",
          "KU423",
          "KU425",
          "KU426",
          "KU430",
          "KU433",
          "KU434",
          "KU435",
          "KU436",
          "KU438",
          "KU440",
          "KU441",
          "KU444",
          "KU445",
          "KU475",
          "KU478",
          "KU480",
          "KU481",
          "KU483",
          "KU484",
          "KU489",
          "KU491",
          "KU494",
          "KU495",
          "KU498",
          "KU499",
          "KU500",
          "KU503",
          "KU504",
          "KU505",
          "KU507",
          "KU508",
          "KU529",
          "KU531",
          "KU535",
          "KU536",
          "KU538",
          "KU541",
          "KU543",
          "KU545",
          "KU560",
          "KU561",
          "KU562",
          "KU563",
          "KU564",
          "KU576",
          "KU577",
          "KU578",
          "KU580",
          "KU581",
          "KU583",
          "KU584",
          "KU592",
          "KU593",
          "KU595",
          "KU598",
          "KU599",
          "KU601",
          "KU604",
          "KU607",
          "KU608",
          "KU609"
        ]
      }
    },
    {
      "code": "Rikosryhmä ja teonkuvauksen tarkenne",
      "selection": {
        "filter": "item",
        "values": [
          "101T603",
          "101T504X406",
          "101T161",
          "101T103",
          "101",
          "102",
          "103",
          "101T103a0108",
          "101T103a0107",
          "101T103a0101",
          "101T103a0102",
          "101T103a0103",
          "101T103a0104",
          "101T103a0105",
          "101T103a0106",
          "111",
          "112",
          "113",
          "114",
          "114a0201",
          "115",
          "115a0301",
          "116",
          "117",
          "121T122",
          "121",
          "122",
          "121T122a1701",
          "121T122a1702",
          "121T122a1703",
          "121T122a1704",
          "121T122a1706",
          "121T122a1705",
          "121T122a17XX",
          "123",
          "131T132",
          "131",
          "132",
          "131T132a1701",
          "131T132a1702",
          "131T132a1703",
          "131T132a1704",
          "131T132a1706",
          "131T132a1705",
          "131T132a17XX",
          "133",
          "133a9999",
          "134",
          "134a9999",
          "135",
          "136",
          "141",
          "142",
          "143",
          "143a0499",
          "144",
          "144a0499",
          "143T144a0401",
          "145",
          "146",
          "151",
          "152",
          "153",
          "154",
          "155",
          "156",
          "157",
          "158",
          "159",
          "158T159a0501",
          "160",
          "161",
          "201T223",
          "201_202_205",
          "201",
          "202",
          "205",
          "201_202_205a1701",
          "201_202_205a1702",
          "201_202_205a1703",
          "201_202_205a1704",
          "201_202_205a1706",
          "201_202_205a1705",
          "201_202_205a17XX",
          "203",
          "203a1701",
          "203a1702",
          "203a1703",
          "203a1704",
          "203a1706",
          "203a1705",
          "203a17XX",
          "204",
          "211T213",
          "211",
          "212",
          "213",
          "211T213a1701",
          "211T213a1702",
          "211T213a1703",
          "211T213a1704",
          "211T213a1706",
          "211T213a1705",
          "211T213a17XX",
          "206",
          "221",
          "221a0601",
          "221a0602",
          "221a0603",
          "221a0604",
          "221a0699",
          "222",
          "222a0701",
          "222a0702",
          "222a0703",
          "222a0704",
          "222a0799",
          "223",
          "231T241",
          "231",
          "232",
          "232a1701",
          "232a1702",
          "232a1703",
          "232a1704",
          "232a1706",
          "232a1705",
          "232a17XX",
          "233",
          "234",
          "234a1701",
          "234a1702",
          "234a1703",
          "234a1704",
          "234a1706",
          "234a1705",
          "234a17XX",
          "235",
          "236",
          "236a1707",
          "237",
          "237a1707",
          "238",
          "239",
          "240",
          "240a1707",
          "241",
          "241a1707",
          "301T321",
          "301",
          "301a0801",
          "302",
          "302a0901",
          "311",
          "312",
          "313",
          "321",
          "331_332_501T504",
          "501",
          "501a1001",
          "502",
          "502a1101",
          "331T332",
          "331T332a2101",
          "331T332a2102",
          "331T332a2103",
          "331",
          "331a2101",
          "331a2102",
          "331a2103",
          "332",
          "332a2101",
          "332a2102",
          "332a2103",
          "333",
          "334",
          "503",
          "504",
          "322_323_341T458X406",
          "341",
          "351",
          "352",
          "323",
          "365",
          "355",
          "357",
          "359",
          "322",
          "451_452_456T458",
          "451",
          "452",
          "456",
          "457",
          "458",
          "361",
          "407",
          "408",
          "409",
          "406_505_601T603",
          "406",
          "505",
          "505a1201",
          "505a2501",
          "505a2502",
          "505a1205",
          "601",
          "602",
          "600",
          "603"
        ]
      }
    }
  ],
  "response": {
    "format": "json-stat2"
  }
}`, 
`{
  "query": [
    {
      "code": "Kuukausi",
      "selection": {
        "filter": "item",
        "values": [
          "2024M12",
          "2025M01",
          "2025M02",
          "2025M03"
        ]
      }
    },
    {
      "code": "Kunta",
      "selection": {
        "filter": "agg:_Municipalities in numerical order 2025.agg",
        "values": [
          "KU611",
          "KU614",
          "KU615",
          "KU616",
          "KU619",
          "KU620",
          "KU623",
          "KU624",
          "KU625",
          "KU626",
          "KU630",
          "KU631",
          "KU635",
          "KU636",
          "KU638",
          "KU678",
          "KU680",
          "KU681",
          "KU683",
          "KU684",
          "KU686",
          "KU687",
          "KU689",
          "KU691",
          "KU694",
          "KU697",
          "KU698",
          "KU700",
          "KU702",
          "KU704",
          "KU707",
          "KU710",
          "KU729",
          "KU732",
          "KU734",
          "KU736",
          "KU738",
          "KU739",
          "KU740",
          "KU742",
          "KU743",
          "KU746",
          "KU747",
          "KU748",
          "KU749",
          "KU751",
          "KU753",
          "KU755",
          "KU758",
          "KU759",
          "KU761",
          "KU762",
          "KU765",
          "KU766",
          "KU768",
          "KU771",
          "KU777",
          "KU778",
          "KU781",
          "KU783",
          "KU785",
          "KU790",
          "KU791",
          "KU831",
          "KU832",
          "KU833",
          "KU834",
          "KU837",
          "KU844",
          "KU845",
          "KU846",
          "KU848",
          "KU849",
          "KU850",
          "KU851",
          "KU853",
          "KU854",
          "KU857",
          "KU858",
          "KU859",
          "KU886",
          "KU887",
          "KU889",
          "KU890",
          "KU892",
          "KU893",
          "KU895",
          "KU905",
          "KU908",
          "KU915",
          "KU918",
          "KU921",
          "KU922",
          "KU924",
          "KU925",
          "KU927",
          "KU931",
          "KU934",
          "KU935",
          "KU936"
        ]
      }
    },
    {
      "code": "Rikosryhmä ja teonkuvauksen tarkenne",
      "selection": {
        "filter": "item",
        "values": [
          "101T603",
          "101T504X406",
          "101T161",
          "101T103",
          "101",
          "102",
          "103",
          "101T103a0108",
          "101T103a0107",
          "101T103a0101",
          "101T103a0102",
          "101T103a0103",
          "101T103a0104",
          "101T103a0105",
          "101T103a0106",
          "111",
          "112",
          "113",
          "114",
          "114a0201",
          "115",
          "115a0301",
          "116",
          "117",
          "121T122",
          "121",
          "122",
          "121T122a1701",
          "121T122a1702",
          "121T122a1703",
          "121T122a1704",
          "121T122a1706",
          "121T122a1705",
          "121T122a17XX",
          "123",
          "131T132",
          "131",
          "132",
          "131T132a1701",
          "131T132a1702",
          "131T132a1703",
          "131T132a1704",
          "131T132a1706",
          "131T132a1705",
          "131T132a17XX",
          "133",
          "133a9999",
          "134",
          "134a9999",
          "135",
          "136",
          "141",
          "142",
          "143",
          "143a0499",
          "144",
          "144a0499",
          "143T144a0401",
          "145",
          "146",
          "151",
          "152",
          "153",
          "154",
          "155",
          "156",
          "157",
          "158",
          "159",
          "158T159a0501",
          "160",
          "161",
          "201T223",
          "201_202_205",
          "201",
          "202",
          "205",
          "201_202_205a1701",
          "201_202_205a1702",
          "201_202_205a1703",
          "201_202_205a1704",
          "201_202_205a1706",
          "201_202_205a1705",
          "201_202_205a17XX",
          "203",
          "203a1701",
          "203a1702",
          "203a1703",
          "203a1704",
          "203a1706",
          "203a1705",
          "203a17XX",
          "204",
          "211T213",
          "211",
          "212",
          "213",
          "211T213a1701",
          "211T213a1702",
          "211T213a1703",
          "211T213a1704",
          "211T213a1706",
          "211T213a1705",
          "211T213a17XX",
          "206",
          "221",
          "221a0601",
          "221a0602",
          "221a0603",
          "221a0604",
          "221a0699",
          "222",
          "222a0701",
          "222a0702",
          "222a0703",
          "222a0704",
          "222a0799",
          "223",
          "231T241",
          "231",
          "232",
          "232a1701",
          "232a1702",
          "232a1703",
          "232a1704",
          "232a1706",
          "232a1705",
          "232a17XX",
          "233",
          "234",
          "234a1701",
          "234a1702",
          "234a1703",
          "234a1704",
          "234a1706",
          "234a1705",
          "234a17XX",
          "235",
          "236",
          "236a1707",
          "237",
          "237a1707",
          "238",
          "239",
          "240",
          "240a1707",
          "241",
          "241a1707",
          "301T321",
          "301",
          "301a0801",
          "302",
          "302a0901",
          "311",
          "312",
          "313",
          "321",
          "331_332_501T504",
          "501",
          "501a1001",
          "502",
          "502a1101",
          "331T332",
          "331T332a2101",
          "331T332a2102",
          "331T332a2103",
          "331",
          "331a2101",
          "331a2102",
          "331a2103",
          "332",
          "332a2101",
          "332a2102",
          "332a2103",
          "333",
          "334",
          "503",
          "504",
          "322_323_341T458X406",
          "341",
          "351",
          "352",
          "323",
          "365",
          "355",
          "357",
          "359",
          "322",
          "451_452_456T458",
          "451",
          "452",
          "456",
          "457",
          "458",
          "361",
          "407",
          "408",
          "409",
          "406_505_601T603",
          "406",
          "505",
          "505a1201",
          "505a2501",
          "505a2502",
          "505a1205",
          "601",
          "602",
          "600",
          "603"
        ]
      }
    }
  ],
  "response": {
    "format": "json-stat2"
  }
}`,
 `{
  "query": [
    {
      "code": "Kuukausi",
      "selection": {
        "filter": "item",
        "values": [
          "2024M12",
          "2025M01",
          "2025M02",
          "2025M03"
        ]
      }
    },
    {
      "code": "Kunta",
      "selection": {
        "filter": "agg:_Municipalities in numerical order 2025.agg",
        "values": [
          "KU941",
          "KU946",
          "KU976",
          "KU977",
          "KU980",
          "KU981",
          "KU989",
          "KU992"
        ]
      }
    },
    {
      "code": "Rikosryhmä ja teonkuvauksen tarkenne",
      "selection": {
        "filter": "item",
        "values": [
          "101T603",
          "101T504X406",
          "101T161",
          "101T103",
          "101",
          "102",
          "103",
          "101T103a0108",
          "101T103a0107",
          "101T103a0101",
          "101T103a0102",
          "101T103a0103",
          "101T103a0104",
          "101T103a0105",
          "101T103a0106",
          "111",
          "112",
          "113",
          "114",
          "114a0201",
          "115",
          "115a0301",
          "116",
          "117",
          "121T122",
          "121",
          "122",
          "121T122a1701",
          "121T122a1702",
          "121T122a1703",
          "121T122a1704",
          "121T122a1706",
          "121T122a1705",
          "121T122a17XX",
          "123",
          "131T132",
          "131",
          "132",
          "131T132a1701",
          "131T132a1702",
          "131T132a1703",
          "131T132a1704",
          "131T132a1706",
          "131T132a1705",
          "131T132a17XX",
          "133",
          "133a9999",
          "134",
          "134a9999",
          "135",
          "136",
          "141",
          "142",
          "143",
          "143a0499",
          "144",
          "144a0499",
          "143T144a0401",
          "145",
          "146",
          "151",
          "152",
          "153",
          "154",
          "155",
          "156",
          "157",
          "158",
          "159",
          "158T159a0501",
          "160",
          "161",
          "201T223",
          "201_202_205",
          "201",
          "202",
          "205",
          "201_202_205a1701",
          "201_202_205a1702",
          "201_202_205a1703",
          "201_202_205a1704",
          "201_202_205a1706",
          "201_202_205a1705",
          "201_202_205a17XX",
          "203",
          "203a1701",
          "203a1702",
          "203a1703",
          "203a1704",
          "203a1706",
          "203a1705",
          "203a17XX",
          "204",
          "211T213",
          "211",
          "212",
          "213",
          "211T213a1701",
          "211T213a1702",
          "211T213a1703",
          "211T213a1704",
          "211T213a1706",
          "211T213a1705",
          "211T213a17XX",
          "206",
          "221",
          "221a0601",
          "221a0602",
          "221a0603",
          "221a0604",
          "221a0699",
          "222",
          "222a0701",
          "222a0702",
          "222a0703",
          "222a0704",
          "222a0799",
          "223",
          "231T241",
          "231",
          "232",
          "232a1701",
          "232a1702",
          "232a1703",
          "232a1704",
          "232a1706",
          "232a1705",
          "232a17XX",
          "233",
          "234",
          "234a1701",
          "234a1702",
          "234a1703",
          "234a1704",
          "234a1706",
          "234a1705",
          "234a17XX",
          "235",
          "236",
          "236a1707",
          "237",
          "237a1707",
          "238",
          "239",
          "240",
          "240a1707",
          "241",
          "241a1707",
          "301T321",
          "301",
          "301a0801",
          "302",
          "302a0901",
          "311",
          "312",
          "313",
          "321",
          "331_332_501T504",
          "501",
          "501a1001",
          "502",
          "502a1101",
          "331T332",
          "331T332a2101",
          "331T332a2102",
          "331T332a2103",
          "331",
          "331a2101",
          "331a2102",
          "331a2103",
          "332",
          "332a2101",
          "332a2102",
          "332a2103",
          "333",
          "334",
          "503",
          "504",
          "322_323_341T458X406",
          "341",
          "351",
          "352",
          "323",
          "365",
          "355",
          "357",
          "359",
          "322",
          "451_452_456T458",
          "451",
          "452",
          "456",
          "457",
          "458",
          "361",
          "407",
          "408",
          "409",
          "406_505_601T603",
          "406",
          "505",
          "505a1201",
          "505a2501",
          "505a2502",
          "505a1205",
          "601",
          "602",
          "600",
          "603"
        ]
      }
    }
  ],
  "response": {
    "format": "json-stat2"
  }
}`
    ];

    public static async fetchAndStoreCrimeData(): Promise<void> {
        try {
            console.log('Starting crime data update process...');

            // Process queries sequentially with rate limiting
            for (const query of this.QUERIES) {
                try {
                    await pRetry(
                        async () => {
                            await this.processQuery(query);
                            // Add rate limiting delay
                            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
                        },
                        {
                            retries: this.RETRY_ATTEMPTS,
                            onFailedAttempt: error => {
                                console.log(
                                    `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
                                );
                            },
                            factor: 2,
                            minTimeout: this.RETRY_DELAY,
                            maxTimeout: 5000
                        }
                    );
                } catch (error) {
                    console.error('Error processing query:', error);
                }
            }

            console.log('All crime data update attempts completed');
            
            // Verify Oulu's data was stored
            await this.verifyOuluData();
        } catch (error) {
            console.error('Error in crime data update process:', error);
            throw error;
        }
    }

    private static async processQuery(query: string): Promise<void> {
        try {
            // Parse the raw JSON query
            const jsonQuery = typeof query === 'string' ? JSON.parse(query) : query;

            const response = await axios.post<CrimeDataResponse>(`${this.API_URL}`, jsonQuery, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'RealEstateSync/1.0'
                }
            });

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Invalid response from API');
            }

            const data = response.data;

            // Process and store the data in smaller batches
            if (data.value && Array.isArray(data.value)) {
                const months = data.dimension.Kuukausi.category.index;
                const municipalities = data.dimension.Kunta.category.index;
                const crimeGroups = data.dimension['Rikosryhmä ja teonkuvauksen tarkenne'].category.index;

                let valueIndex = 0;
                let successCount = 0;
                let errorCount = 0;
                let batchValues: any[] = [];

                for (const monthIndex of Object.keys(months)) {
                    for (const municipalityIndex of Object.keys(municipalities)) {
                        for (const crimeGroupIndex of Object.keys(crimeGroups)) {
                            const value = data.value[valueIndex++];
                            if (value === null) continue;

                            try {
                                const month = data.dimension.Kuukausi.category.label[monthIndex];
                                const municipality = data.dimension.Kunta.category.index[municipalityIndex];
                                const crimeGroup = data.dimension['Rikosryhmä ja teonkuvauksen tarkenne'].category.index[crimeGroupIndex];
                                const crimeGroupName = data.dimension['Rikosryhmä ja teonkuvauksen tarkenne'].category.label[crimeGroupIndex];

                                const formattedMonth = month.replace('M', '-').substring(0, 7);
                                const numericValue = typeof value === 'string' ? parseFloat(value) : value;

                                batchValues.push({
                                    month: formattedMonth,
                                    municipality_code: municipality,
                                    municipality_name: data.dimension.Kunta.category.label[municipalityIndex],
                                    crime_group_code: crimeGroup,
                                    crime_group_name: crimeGroupName,
                                    crime_count: numericValue
                                });

                                if (batchValues.length >= this.BATCH_SIZE) {
                                    await this.processBatch(batchValues);
                                    successCount += batchValues.length;
                                    batchValues = [];
                                }
                            } catch (error) {
                                console.error('Error preparing data:', error);
                                errorCount++;
                            }
                        }
                    }
                }

                // Process any remaining records
                if (batchValues.length > 0) {
                    await this.processBatch(batchValues);
                    successCount += batchValues.length;
                }

                console.log(`Query completed: ${successCount} records inserted/updated, ${errorCount} errors`);
            }
        } catch (error) {
            console.error('Error processing query:', error);
            throw error;
        }
    }

    private static async processBatch(batchValues: any[]): Promise<void> {
        try {
            await db.transaction(async (tx) => {
                for (const value of batchValues) {
                    await tx.execute(sql`
                        INSERT INTO crime_data (
                            month,
                            municipality_code,
                            municipality_name,
                            crime_group_code,
                            crime_group_name,
                            crime_count
                        ) VALUES (
                            ${value.month},
                            ${value.municipality_code},
                            ${value.municipality_name},
                            ${value.crime_group_code},
                            ${value.crime_group_name},
                            ${value.crime_count}
                        )
                        ON CONFLICT (month, municipality_code, crime_group_code) 
                        DO UPDATE SET 
                            crime_count = EXCLUDED.crime_count,
                            updated_at = CURRENT_TIMESTAMP
                    `);
                }
            });
        } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
        }
    }

    public static startScheduledUpdates(): void {
        // Run immediately on startup
        this.fetchAndStoreCrimeData().catch(error => {
            console.error('Error in initial crime data fetch:', error);
        });

        // Set up the cron job for regular updates
        const job = new CronJob(this.UPDATE_CRON, async () => {
            await this.fetchAndStoreCrimeData();
        });

        job.start();
        console.log('Crime data update scheduler started (running every 24 hours)');
    }

    public static async verifyOuluData(): Promise<void> {
        try {
            const ouluData = await db.select().from(crime_data)
                .where(eq(crime_data.municipality_code, 'KU564'))
                .limit(5);

            console.log('Oulu crime data sample:', ouluData);
            
            const totalRecords = await db.select({ count: sql<number>`count(*)` })
                .from(crime_data)
                .where(eq(crime_data.municipality_code, 'KU564'));

            console.log('Total records for Oulu:', totalRecords[0].count);
        } catch (error) {
            console.error('Error verifying Oulu data:', error);
        }
    }
} 