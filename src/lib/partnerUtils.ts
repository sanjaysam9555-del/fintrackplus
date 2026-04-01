import { Partner } from './types';

/**
 * Returns the canonical identifier for a partner to use as `handledBy` value.
 * Company accounts use their record `id` (UUID) to avoid collision with the owner's `userId`.
 * Regular partners use their `userId` (auth ID) for backward compatibility.
 */
export const getPartnerId = (partner: Partner): string =>
  partner.isCompanyAccount ? partner.id : (partner.userId || partner.id);

/**
 * Finds a partner by a `handledBy` value.
 * 1. Exact match on `partner.id` — catches company accounts and direct ID references.
 * 2. Fallback: match on `partner.userId` but SKIP company accounts to prevent collision.
 */
export const findPartnerByHandledBy = (partners: Partner[], handledBy?: string): Partner | undefined => {
  if (!handledBy) return undefined;
  return (
    partners.find(p => p.id === handledBy) ||
    partners.find(p => !p.isCompanyAccount && p.userId === handledBy)
  );
};
