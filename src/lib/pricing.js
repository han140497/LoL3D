import { PRICING } from './constants.js';

// Mirrors the formulas in LoL3D-Content/pricing_calculator.xlsx exactly:
//   material  = (grams / 1000) * filamentCostPerKg
//   power     = printTimeHours * printerPowerKw * electricityRatePerKwh
//   labor     = laborTimeHours * laborRatePerHour
//   waste     = (material + power) * wasteAllowancePercent
//   total     = material + power + labor + waste + packaging
//   suggested = total * (1 + markup)
//   rounded   = suggested rounded to the nearest ₹10 (MROUND)
//
// All rate params fall back to the PRICING constants when omitted,
// so callers that don't pass live DB rates still work correctly.
export function calculateProductPrice({
  filamentWeightG,
  printTimeHours,
  laborTimeHours = 0,
  markupPercent,
  filamentCostPerKg,
  printerPowerKw,
  electricityRatePerKwh,
  laborRatePerHour,
  packagingCostFlat,
  wasteAllowancePercent,
}) {
  const grams = Number(filamentWeightG);
  const hours = Number(printTimeHours);
  if (!Number.isFinite(grams) || grams <= 0 || !Number.isFinite(hours) || hours <= 0) return null;

  const labor   = Number.isFinite(Number(laborTimeHours)) ? Number(laborTimeHours) : 0;
  const markup  = Number.isFinite(Number(markupPercent))  ? Number(markupPercent)  : PRICING.defaultMarkupPercent;

  const costPerKg   = Number.isFinite(Number(filamentCostPerKg))      ? Number(filamentCostPerKg)      : PRICING.filamentCostPerKg;
  const powerKw     = Number.isFinite(Number(printerPowerKw))          ? Number(printerPowerKw)          : PRICING.printerPowerKw;
  const elecRate    = Number.isFinite(Number(electricityRatePerKwh))   ? Number(electricityRatePerKwh)   : PRICING.electricityRatePerKwh;
  const laborRate   = Number.isFinite(Number(laborRatePerHour))        ? Number(laborRatePerHour)        : PRICING.laborRatePerHour;
  const packaging   = Number.isFinite(Number(packagingCostFlat))       ? Number(packagingCostFlat)       : PRICING.packagingCost;
  const wastePct    = Number.isFinite(Number(wasteAllowancePercent))   ? Number(wasteAllowancePercent)   : PRICING.wasteAllowancePercent;

  const materialCost    = (grams / 1000) * costPerKg;
  const electricityCost = hours * powerKw * elecRate;
  const laborCost       = labor * laborRate;
  const wasteCost       = (materialCost + electricityCost) * wastePct;
  const packagingCost   = packaging;
  const totalCost       = materialCost + electricityCost + laborCost + wasteCost + packagingCost;
  const suggestedPrice  = totalCost * (1 + markup);
  const roundedPrice    = Math.round(suggestedPrice / 10) * 10;

  return { materialCost, electricityCost, laborCost, wasteCost, packagingCost, totalCost, markup, suggestedPrice, roundedPrice };
}
