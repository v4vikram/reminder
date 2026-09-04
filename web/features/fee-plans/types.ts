/**
 * A gym's price tier, e.g. 2 months for 700.
 *
 * Bundles are usually discounted, so `amount` is not months x monthly rate -
 * it is whatever the owner charges for that duration.
 */
export interface FeePlan {
  id: string;
  months: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeePlanInput {
  months: number;
  amount: number;
}

export interface UpdateFeePlanInput {
  months?: number;
  amount?: number;
}
