// Джерело для db:seed — стартовий довідник валют.
export const mockCurrencies: {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: "before" | "after";
  decimalPlaces: number;
  isActive: boolean;
  isDefault: boolean;
  autoUpdate: boolean;
}[] = [
  {
    code: "UAH",
    name: "Українська гривня",
    symbol: "₴",
    symbolPosition: "after",
    decimalPlaces: 2,
    isActive: true,
    isDefault: true,
    autoUpdate: true,
  },
  {
    code: "USD",
    name: "Долар США",
    symbol: "$",
    symbolPosition: "before",
    decimalPlaces: 2,
    isActive: true,
    isDefault: false,
    autoUpdate: true,
  },
  {
    code: "EUR",
    name: "Євро",
    symbol: "€",
    symbolPosition: "after",
    decimalPlaces: 2,
    isActive: true,
    isDefault: false,
    autoUpdate: true,
  },
  {
    code: "PLN",
    name: "Польський злотий",
    symbol: "zł",
    symbolPosition: "after",
    decimalPlaces: 2,
    isActive: true,
    isDefault: false,
    autoUpdate: true,
  },
];
