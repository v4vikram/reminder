/**
 * Response envelopes. See docs/api-contract.md §1.2.
 *
 * Every success response uses this shape so the frontend writes one
 * parsing path instead of guessing per endpoint.
 */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

export function ok<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data };
}

export function paginated<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): SuccessEnvelope<Paginated<T>> {
  return {
    success: true,
    data: { items, page, limit, total, hasNext: page * limit < total },
  };
}
