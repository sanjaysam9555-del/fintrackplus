import { Partner } from "./types";

export const INTERNAL_TRANSFER_VENDORS = [
  "Partner Transfer",
  "Self Transfer",
  "Transfer To Company Account",
  "Withdrawal from Company Account",
] as const;

export const getPartnerHandledByKey = (partner?: Partner | null) => {
  if (!partner) return undefined;
  return partner.isCompanyAccount ? partner.id : partner.userId || partner.id;
};

export const findPartnerByHandledBy = (partners: Partner[], handledBy?: string | null) => {
  if (!handledBy) return undefined;
  const exactMatch = partners.find((partner) => getPartnerHandledByKey(partner) === handledBy);
  if (exactMatch) return exactMatch;

  // Backward compatibility for older regular-partner transactions that may have
  // stored partner.id instead of partner.userId. Never match company accounts by
  // userId because their user_id can be the owner's id and would pollute balances.
  return partners.find((partner) => !partner.isCompanyAccount && partner.id === handledBy);
};

export const doesHandledByBelongToPartner = (partner?: Partner | null, handledBy?: string | null) => {
  if (!partner || !handledBy) return false;
  if (partner.isCompanyAccount) return handledBy === partner.id;
  return handledBy === partner.userId || handledBy === partner.id;
};

export const isHandledByAssignedToAnyPartner = (partners: Partner[], handledBy?: string | null) => {
  return Boolean(findPartnerByHandledBy(partners, handledBy));
};

export const isInternalTransferVendor = (vendor?: string | null) => {
  if (!vendor) return false;
  return INTERNAL_TRANSFER_VENDORS.includes(vendor as (typeof INTERNAL_TRANSFER_VENDORS)[number]);
};

export const getInternalTransferVendor = (fromPartner?: Partner, toPartner?: Partner) => {
  if (fromPartner?.isCompanyAccount && !toPartner?.isCompanyAccount) {
    return "Withdrawal from Company Account";
  }

  if (!fromPartner?.isCompanyAccount && toPartner?.isCompanyAccount) {
    return "Transfer To Company Account";
  }

  return "Partner Transfer";
};