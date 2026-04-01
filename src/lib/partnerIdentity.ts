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
  return partners.find((partner) => getPartnerHandledByKey(partner) === handledBy);
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