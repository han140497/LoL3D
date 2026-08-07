import { PRICING } from './constants.js';

// Mirrors the formulas in LoL3D-Content/pricing_calculator.xlsx exactly:
//   material  = (grams / 1000) * filamentCostPerKg
//   power     = printTimeHours * printerPowerKw * electricityRatePerKwh
//   labor     = laborTimeHours * laborRatePerHour
//   waste     = (material + power) * wasteAllowancePercent
//   total     = material + power + labor + waste + packaging
//   suggested = total * (1 + markup)
//   rounded   = suggested rounded to the nearest ₹10 (MROUND)
export function calculateProductPrice({ filamentWeightG, printTimeHours, laborTimeHours = 0, markupPercent }) {
  const grams = Number(filamentWeightG);
  const hours = Number(printTimeHours);
  if (!Number.isFinite(grams) || grams <= 0 || !Number.isFinite(hours) || hours <= 0) return null;

  const labor = Number.isFinite(Number(laborTimeHours)) ? Number(laborTimeHours) : 0;
  const markup = Number.isFinite(Number(markupPercent)) ? Number(markupPercent) : PRICING.defaultMarkupPercent;

  const materialCost = (grams / 1000) * PRICING.filamentCostPerKg;
  const electricityCost = hours * PRICING.printerPowerKw * PRICING.electricityRatePerKwh;
  const laborCost = labor * PRICING.laborRatePerHour;
  const wasteCost = (materialCost + electricityCost) * PRICING.wasteAllowancePercent;
  const packagingCost = PRICING.packagingCost;
  const totalCost = materialCost + electricityCost + laborCost + wasteCost + packagingCost;
  const suggestedPrice = totalCost * (1 + markup);
  const roundedPrice = Math.round(suggestedPrice / 10) * 10;

  return { materialCost, electricityCost, laborCost, wasteCost, packagingCost, totalCost, markup, suggestedPrice, roundedPrice };
}
