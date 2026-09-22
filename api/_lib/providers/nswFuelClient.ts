import crypto from 'node:crypto';

const TOKEN_URL = 'https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken';
const API_BASE = 'https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel';

export interface RawNswStation {
  brand: string;
  code: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
}

export interface RawNswPrice {
  stationcode: string;
  fueltype: string;
  price: number;
  lastupdated: string;
}

export interface RawNswPricesResponse {
  stations: RawNswStation[];
  prices: RawNswPrice[];
}

export interface RawNswFuelType {
  code: string;
  name: string;
}

export interface RawNswReferenceData {
  fueltypes: { items: RawNswFuelType[] };
  brands: { items: { name: string }[] };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function getCredentials(): { key: string; secret: string } {
  const key = process.env.NSW_FUELCHECK_API_KEY;
  const secret = process.env.NSW_FUELCHECK_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      'NSW_FUELCHECK_API_KEY / NSW_FUELCHECK_API_SECRET are not configured. See .env.example.',
    );
  }
  return { key, secret };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { key, secret } = getCredentials();
  const basicAuth = Buffer.from(`${key}:${secret}`).toString('base64');

  const response = await fetch(`${TOKEN_URL}?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  if (!response.ok) {
    throw new Error(`NSW FuelCheck OAuth failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in?: string | number };
  const expiresInSeconds = Number(data.expires_in) || 60 * 60 * 11; // conservative default ~11h
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
  return cachedToken.value;
}

function formatRequestTimestamp(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

async function nswApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { key } = getCredentials();
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
      apikey: key,
      transactionid: crypto.randomUUID(),
      requesttimestamp: formatRequestTimestamp(new Date()),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`NSW FuelCheck API error: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

/** All current fuel prices for every NSW service station in one call. This
 * is the only call we make on a schedule (cached, see api/_lib/cache.ts) —
 * per-user requests are answered from the cache and filtered in memory,
 * which keeps us comfortably inside the free tier's monthly call limit. */
export function getAllPrices(): Promise<RawNswPricesResponse> {
  return nswApiFetch<RawNswPricesResponse>('/prices');
}

/** Fuel type codes/names and brand list. Changes rarely, cached for hours.
 * The API 500s without an `if-modified-since` header even though the docs
 * describe it as optional — send a far-past date so we always get the full
 * list rather than an empty "nothing changed" response. */
export function getReferenceData(): Promise<RawNswReferenceData> {
  return nswApiFetch<RawNswReferenceData>('/lovs', {
    headers: { 'if-modified-since': '01/01/2010 00:00:00' },
  });
}
