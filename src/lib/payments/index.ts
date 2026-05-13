/**
 * Mobile Money payment service abstraction layer.
 *
 * Currently mocked. To integrate real providers, replace the body of
 * verifyMTN() and verifyAirtel() with their respective API calls:
 *
 * MTN MoMo Collections API:
 *   POST https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/{referenceId}
 *   Headers: X-Target-Environment, Ocp-Apim-Subscription-Key, Authorization: Bearer <token>
 *
 * Airtel Money API:
 *   POST https://openapi.airtel.africa/merchant/v1/payments/
 *   Headers: X-Country, X-Currency, Authorization: Bearer <token>
 *
 * See: https://momodeveloper.mtn.com / https://developers.airtel.africa
 */

import type { MobileMoneyProvider } from '@/types';

export interface PaymentVerifyResult {
  verified: boolean;
  status: 'completed' | 'failed' | 'pending';
  providerMessage: string;
}

async function verifyMTN(reference: string, phoneNumber: string): Promise<PaymentVerifyResult> {
  void reference; void phoneNumber;
  // TODO: call MTN MoMo Collections API
  // 1. POST /collection/v1_0/requesttopay with X-Reference-Id: reference
  // 2. Poll GET /collection/v1_0/requesttopay/{reference} until status != PENDING
  // 3. Map MTN status (SUCCESSFUL/FAILED/PENDING) to our PaymentVerifyResult
  await new Promise((r) => setTimeout(r, 1500)); // simulate provider round-trip
  return { verified: true, status: 'completed', providerMessage: 'SUCCESSFUL' };
}

async function verifyAirtel(reference: string, phoneNumber: string): Promise<PaymentVerifyResult> {
  void reference; void phoneNumber;
  // TODO: call Airtel Money API
  // 1. POST /merchant/v1/payments/ with reference
  // 2. Check response status field (TS = success, TF = failed)
  await new Promise((r) => setTimeout(r, 1500));
  return { verified: true, status: 'completed', providerMessage: 'TS' };
}

export async function verifyMobileMoneyPayment(
  provider: MobileMoneyProvider,
  reference: string,
  phoneNumber: string
): Promise<PaymentVerifyResult> {
  switch (provider) {
    case 'mtn':    return verifyMTN(reference, phoneNumber);
    case 'airtel': return verifyAirtel(reference, phoneNumber);
    default:
      return { verified: false, status: 'failed', providerMessage: 'Unknown provider' };
  }
}
