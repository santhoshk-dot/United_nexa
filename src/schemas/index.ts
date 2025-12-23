import { z } from 'zod';

// --- SHARED PATTERNS (Match Backend) ---
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAR_REGEX = /^\d{12}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const VEHICLE_REGEX = /^[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z])?(?:[ -]?[A-Z]*)?[ -]?[0-9]{4}$/;

// --- Helper ---
const optionalNumericString = z.coerce.number().default(0);
// 🟢 NEW: Helper for required numeric fields (accepts string/number, rejects empty)
const requiredNumericString = z.union([z.string(), z.number()])
  .transform((val) => val.toString())
  .refine((val) => val.trim().length > 0, "Bill Value is required")
  .refine((val) => !isNaN(Number(val)), "Bill Value must be a number")
  .transform((val) => Number(val));

// --- 1. Auth Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().regex(MOBILE_REGEX, "Invalid Mobile Number"),
  role: z.enum(['admin', 'user']).optional(),
});

// --- 2. Master Data Schemas ---
export const consignorSchema = z.object({
  name: z.string().min(1, "Consignor Name is required"),
  gst: z.string().regex(GST_REGEX, "Invalid GST Format"),
  address: z.string().optional(),
  mobile: z.string().optional().refine(val => !val || MOBILE_REGEX.test(val), {
    message: "Invalid Mobile Number"
  }),
  from: z.string().default('Sivakasi'),
  pan: z.string().optional().refine(val => !val || PAN_REGEX.test(val), {
    message: "Invalid PAN Format"
  }),
  aadhar: z.string().optional().refine(val => !val || AADHAR_REGEX.test(val), {
    message: "Invalid Aadhar Format"
  }),
});

export const consigneeSchema = z.object({
  name: z.string().min(1, "Consignee Name is required"),
  destination: z.string().min(1, "Destination is required"),
  address: z.string().optional(),
  phone: z.string().regex(MOBILE_REGEX, "Invalid Mobile Number"),
  gst: z.string().optional().refine(val => !val || GST_REGEX.test(val), {
    message: "Invalid GST Format"
  }),
  pan: z.string().optional().refine(val => !val || PAN_REGEX.test(val), {
    message: "Invalid PAN Format"
  }),
  aadhar: z.string().optional().refine(val => !val || AADHAR_REGEX.test(val), {
    message: "Invalid Aadhar Format"
  }),
}).refine((data) => {
  const hasGst = data.gst && data.gst.trim().length > 0;
  const hasPan = data.pan && data.pan.trim().length > 0;
  const hasAadhar = data.aadhar && data.aadhar.trim().length > 0;
  return hasGst || hasPan || hasAadhar;
}, {
  message: "At least one proof (GST, PAN, or Aadhar) is required",
  path: ["gst"],
});

export const vehicleSchema = z.object({
  vehicleNo: z.string().regex(VEHICLE_REGEX, "Invalid Vehicle Number (e.g., TN01AB1234)"),
  vehicleName: z.string().min(1, "Vehicle Name is required"),
  ownerName: z.string().min(1, "Owner Name is required"), // Changed to required
  ownerMobile: z.string().regex(MOBILE_REGEX, "Invalid Owner Mobile Number"), // Changed to required and directly using regex
});

export const driverSchema = z.object({
  driverName: z.string().min(1, "Driver Name is required"),
  dlNo: z.string().min(5, "License Number is required"),
  mobile: z.string().regex(MOBILE_REGEX, "Invalid Mobile Number"),
});

export const placeSchema = z.object({
  placeName: z.string().min(1, "Place Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
});

export const deleteSchema = z.object({
  data: z.string().min(1, "Reason is required")
});

export const packingSchema = z.object({
  packingName: z.string().min(1, "Packing Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
});

export const contentSchema = z.object({
  contentName: z.string().min(1, "Content Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
});

// --- 3. Operations Schemas ---

export const gcEntrySchema = z.object({
  gcDate: z.string().min(1, "GC Date is required"),
  from: z.string().min(1, "From Place is required"),
  destination: z.string().min(1, "Destination is required"),
  consignorId: z.string().min(1, "Consignor is required"),
  consigneeId: z.string().min(1, "Consignee is required"),

  // netQty is calculated from contentItems
  netQty: z.coerce.number().min(1, "At least one content item is required"),

  deliveryAt: z.string().min(1, "Delivery At is required"),
  freightUptoAt: z.string().min(1, "Freight Upto is required"),
  paymentType: z.enum(['Paid', 'To Pay']),

  billNo: z.string().min(1, "Bill No is required"),
  billDate: z.string().min(1, "Bill Date is required"),
  billValue: requiredNumericString,

  tollFee: optionalNumericString,
  freight: optionalNumericString,
  godownCharge: optionalNumericString,
  statisticCharge: optionalNumericString,
  advanceNone: optionalNumericString,
  balanceToPay: optionalNumericString,
});

export const tripSheetSchema = z.object({
  tsDate: z.string().min(1, "Trip Sheet Date is required"),
  fromPlace: z.string().min(1, "From Place is required"),
  toPlace: z.string().min(1, "To Place is required"),
  carriers: z.string().min(1, "Carriers is required"),
  unloadPlace: z.string().min(1, "Unload Place is required"),

  lorryNo: z.string().min(1, "Lorry No is required"),
  lorryName: z.string().min(1, "Lorry Name is required"),
  driverName: z.string().min(1, "Driver Name is required"),
  driverMobile: z.string().regex(MOBILE_REGEX, "Invalid Driver Mobile"),
  dlNo: z.string().min(1, "DL No is required"),
  ownerName: z.string().min(1, "Owner Name is required"),
  ownerMobile: z.string().optional().refine(val => !val || MOBILE_REGEX.test(val), {
    message: "Invalid Owner Mobile Number"
  }),

  items: z.array(z.any()).min(1, "At least one GC entry must be added to the Trip Sheet"),
});
