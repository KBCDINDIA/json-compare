import type { JsonValue } from './types';

const TYPE_FRIENDLY: Record<string, string> = {
  string: 'text',
  number: 'number',
  boolean: 'yes/no value',
  object: 'group of settings',
  array: 'list',
  null: 'empty',
  undefined: 'empty',
};

export function friendlyType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function friendlyTypeName(v: unknown): string {
  return TYPE_FRIENDLY[friendlyType(v)] ?? 'value';
}

// Common tech / DB / invoicing abbreviations → full English.
// Lookup is case-insensitive. Add entries here to teach the app new words.
const ABBREV: Record<string, string> = {
  // generic
  id: 'ID',
  uid: 'User ID',
  uuid: 'Unique ID',
  ref: 'Reference',
  refno: 'Reference Number',
  num: 'Number',
  no: 'Number',
  nbr: 'Number',
  qty: 'Quantity',
  amt: 'Amount',
  amnt: 'Amount',
  val: 'Value',
  tot: 'Total',
  sub: 'Sub',
  subtot: 'Subtotal',
  pct: 'Percent',
  perc: 'Percent',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
  cnt: 'Count',
  freq: 'Frequency',
  desc: 'Description',
  descr: 'Description',
  dt: 'Date',
  tm: 'Time',
  ts: 'Timestamp',
  dob: 'Date Of Birth',
  doj: 'Date Of Joining',
  ct: 'Created At',
  ut: 'Updated At',
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  stts: 'Status',
  stat: 'Status',
  status: 'Status',
  flag: 'Flag',
  type: 'Type',
  typ: 'Type',
  cat: 'Category',
  categ: 'Category',

  // people / orgs
  usr: 'User',
  user: 'User',
  cust: 'Customer',
  cust_: 'Customer',
  customer: 'Customer',
  mer: 'Merchant',
  merch: 'Merchant',
  merchant: 'Merchant',
  org: 'Organisation',
  dept: 'Department',
  emp: 'Employee',
  admn: 'Admin',
  admin: 'Admin',

  // contact
  addr: 'Address',
  mob: 'Mobile',
  tel: 'Telephone',
  ph: 'Phone',
  eml: 'Email',
  email: 'Email',
  pin: 'PIN Code',
  zip: 'Zip',

  // finance / invoicing
  tx: 'Transaction',
  txn: 'Transaction',
  trans: 'Transaction',
  transaction: 'Transaction',
  inv: 'Invoice',
  invoice: 'Invoice',
  bill: 'Bill',
  pymt: 'Payment',
  pmt: 'Payment',
  paid: 'Paid',
  pay: 'Pay',
  cr: 'Credit',
  dr: 'Debit',
  bal: 'Balance',
  acct: 'Account',
  acc: 'Account',
  ifsc: 'IFSC',
  micr: 'MICR',
  gst: 'GST',
  tax: 'Tax',
  hsn: 'HSN Code',
  sac: 'SAC Code',
  cur: 'Currency',
  curr: 'Currency',
  fx: 'Forex',
  disc: 'Discount',

  // web / api
  req: 'Request',
  resp: 'Response',
  res: 'Response',
  msg: 'Message',
  err: 'Error',
  url: 'URL',
  uri: 'URI',
  api: 'API',
  auth: 'Auth',
  pwd: 'Password',
  pw: 'Password',
  tok: 'Token',
  json: 'JSON',
  xml: 'XML',
  html: 'HTML',
  http: 'HTTP',
  ip: 'IP',
  mac: 'MAC',
  db: 'Database',
  tbl: 'Table',
  col: 'Column',
  fk: 'Foreign Key',
  pk: 'Primary Key',
  idx: 'Index',

  // documents
  doc: 'Document',
  img: 'Image',
  pic: 'Picture',
  att: 'Attachment',
  attach: 'Attachment',
  note: 'Note',
  rmk: 'Remark',
  rmks: 'Remarks',
};

// Always rendered in all caps (after titlecasing)
const ALL_CAPS = new Set([
  'id',
  'url',
  'uri',
  'api',
  'json',
  'xml',
  'html',
  'http',
  'ip',
  'mac',
  'gst',
  'ifsc',
  'micr',
  'pin',
  'sac',
  'hsn',
  'uuid',
  'ssn',
  'pan',
]);

function expandWord(raw: string): string {
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (ABBREV[lower]) return ABBREV[lower];
  if (ALL_CAPS.has(lower)) return lower.toUpperCase();
  // Title case
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function humanizeKey(key: string): string {
  if (!key) return key;
  // Split on non-alphanumeric, camelCase boundaries
  const tokens = key
    .replace(/[_\-./]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return key;

  const expanded = tokens.map(expandWord);
  // De-duplicate adjacent duplicates (e.g. "customer customer id")
  const cleaned: string[] = [];
  for (const w of expanded) {
    if (cleaned.length && cleaned[cleaned.length - 1].toLowerCase() === w.toLowerCase())
      continue;
    cleaned.push(w);
  }
  return cleaned.join(' ');
}

export function humanizePath(path: (string | number)[]): string {
  if (path.length === 0) return 'root';
  return path
    .map((seg) => {
      if (typeof seg === 'number') return `item #${seg + 1}`;
      return humanizeKey(seg);
    })
    .join(' → ');
}

export function fieldNameFromPath(path: (string | number)[]): string {
  if (path.length === 0) return 'the document';
  const last = path[path.length - 1];
  if (typeof last === 'number') {
    const parent = path[path.length - 2];
    return typeof parent === 'string'
      ? `item #${last + 1} of ${humanizeKey(parent)}`
      : `item #${last + 1}`;
  }
  return humanizeKey(last);
}

export function parentPath(path: (string | number)[]): (string | number)[] {
  return path.slice(0, -1);
}

const MAX_INLINE = 60;

export function formatValue(v: JsonValue | undefined): string {
  if (v === undefined) return '(missing)';
  if (v === null) return 'empty';
  if (typeof v === 'string') {
    if (v.length === 0) return '""';
    if (v.length > MAX_INLINE) return `"${v.slice(0, MAX_INLINE)}…"`;
    return `"${v}"`;
  }
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? '' : 's'}]`;
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    return `{${keys.length} field${keys.length === 1 ? '' : 's'}}`;
  }
  return String(v);
}

export function countFields(v: JsonValue): number {
  if (v === null || typeof v !== 'object') return 1;
  if (Array.isArray(v)) {
    let total = 0;
    for (const x of v) total += countFields(x as JsonValue);
    return total;
  }
  let total = 0;
  for (const x of Object.values(v)) total += countFields(x as JsonValue);
  return total;
}
