export interface Option { id: number; name: string; }

/**
 * Drop-down options for the stack details sheet.
 *
 * TODO(before release): StackApi has no bank / commodity endpoint yet, so these are placeholders.
 * Replace the ids with the real master-data ids (they are sent as BankId / CommodityId), or load
 * the lists from the API once it exists.
 */
export const BANKS: Option[] = [
  { id: 1, name: 'State Bank of India' },
  { id: 2, name: 'HDFC Bank' },
  { id: 3, name: 'ICICI Bank' },
  { id: 4, name: 'Punjab National Bank' },
  { id: 5, name: 'Bank of Baroda' },
  { id: 6, name: 'Axis Bank' },
];

export const COMMODITY_CATEGORIES: Option[] = [
  { id: 1, name: 'Cereals' },
  { id: 2, name: 'Pulses' },
  { id: 3, name: 'Oilseeds' },
  { id: 4, name: 'Spices' },
  { id: 5, name: 'Other' },
];
