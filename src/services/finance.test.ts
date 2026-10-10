import { describe, it, expect } from "vitest";

describe("P16 Costing & P&L Arithmetic In-Memory Fixtures", () => {
  it("calculates order material cost, machine overhead, wage cost, total cost and margin accurately", () => {
    // In-memory fixtures
    const order = {
      qtyMetres: 2000,
      ratePerMetre: 150,
      revenue: 300000,
    };

    // Material issues: 400 kg at 180/kg + 200 kg at 220/kg
    const issues = [
      { qtyKg: 400, ratePerKg: 180 },
      { qtyKg: 200, ratePerKg: 220 },
    ];
    const materialCost = issues.reduce((acc, i) => acc + i.qtyKg * i.ratePerKg, 0);
    expect(materialCost).toBe(72000 + 44000); // 116,000

    // Machine overhead: 40 hours on spinning (150/hr), 50 hours on weaving (200/hr), 30 hours on dyeing (250/hr)
    const logs = [
      { hours: 40, hourlyOverhead: 150 },
      { hours: 50, hourlyOverhead: 200 },
      { hours: 30, hourlyOverhead: 250 },
    ];
    const machineOverhead = logs.reduce((acc, l) => acc + l.hours * l.hourlyOverhead, 0);
    expect(machineOverhead).toBe(6000 + 10000 + 7500); // 23,500

    // Wages allocation: total month wages 120,000, order production hours = 120, total month production hours = 600
    const totalMonthWages = 120000;
    const orderHours = logs.reduce((acc, l) => acc + l.hours, 0); // 120
    const totalMonthHours = 600;
    const wageCost = (orderHours / totalMonthHours) * totalMonthWages;
    expect(wageCost).toBe(24000);

    // Total Cost
    const totalCost = materialCost + machineOverhead + wageCost;
    expect(totalCost).toBe(116000 + 23500 + 24000); // 163,500

    // Cost per metre and cost per roll (40 rolls of 50m each)
    const metresProduced = 2000;
    const rollsProduced = 40;
    const costPerMetre = totalCost / metresProduced;
    const costPerRoll = totalCost / rollsProduced;

    expect(costPerMetre).toBe(81.75);
    expect(costPerRoll).toBe(4087.5);

    // Margin & Margin %
    const margin = order.revenue - totalCost;
    const marginPct = (margin / order.revenue) * 100;

    expect(margin).toBe(136500);
    expect(marginPct).toBeCloseTo(45.5, 1);
  });

  it("calculates monthly P&L profit and margin % correctly", () => {
    const revenue = 500000;
    const materialCost = 180000;
    const wages = 80000;
    const machineOverhead = 45000;
    const otherExpenses = 25000;

    const totalCost = materialCost + wages + machineOverhead + otherExpenses;
    const profit = revenue - totalCost;
    const marginPct = (profit / revenue) * 100;

    expect(totalCost).toBe(330000);
    expect(profit).toBe(170000);
    expect(marginPct).toBe(34);
  });
});
