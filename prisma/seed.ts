import {
  PrismaClient,
  Role,
  MachineType,
  MachineStatus,
  StockMovementReason,
  OrderStatus,
  ProductionStage,
  WorkOrderStatus,
  Shift,
  QCStatus,
  InvoiceStatus,
  Prisma,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || "Demo@12345";
  console.log("🌱 Starting idempotent database seed for Everest Textile Mills...");
  console.log("🔐 Password set from SEED_PASSWORD.");

  const defaultPasswordHash = await hashPassword(seedPassword);

  // ==========================================================================
  // 1. SUPPLIERS (4)
  // ==========================================================================
  console.log("📦 Seeding 4 Suppliers...");
  const suppliersData = [
    {
      name: "Premier Spun Cotton Mills",
      contactPerson: "Rajesh Kumar",
      email: "procurement@premierspun.in",
      phone: "+91 98421 11223",
      address: "Post Box 12, Ring Road, Coimbatore, Tamil Nadu",
      active: true,
    },
    {
      name: "Vardhman Synthetics Ltd",
      contactPerson: "Vikram Malhotra",
      email: "sales@vardhmansynth.com",
      phone: "+91 94170 33445",
      address: "Phase IV, Focal Point, Ludhiana, Punjab",
      active: true,
    },
    {
      name: "Lakshmi Organic Yarn Corp",
      contactPerson: "S. Murugan",
      email: "contact@lakshmiyarns.co.in",
      phone: "+91 98944 55667",
      address: "SIPCOT Industrial Complex, Perundurai, Erode",
      active: true,
    },
    {
      name: "KPR Dyes & Intermediates",
      contactPerson: "Anand Venkatesh",
      email: "orders@kprchemical.com",
      phone: "+91 98432 77889",
      address: "Avinashi Road, Tirupur, Tamil Nadu",
      active: true,
    },
  ];

  const suppliers: Record<string, string> = {};
  for (const sup of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: sup.name } });
    if (existing) {
      suppliers[sup.name] = existing.id;
    } else {
      const created = await prisma.supplier.create({ data: sup });
      suppliers[sup.name] = created.id;
    }
  }

  // ==========================================================================
  // 2. BUYERS (6) & BUYER USERS
  // ==========================================================================
  console.log("💼 Seeding 6 Commercial Buyers & Linked Users...");
  const buyersData = [
    {
      name: "Raymond Lifestyle Apparel",
      contactPerson: "Gautam Singhania",
      email: "apparel.sourcing@raymond.in",
      phone: "+91 22 6152 7000",
      address: "Jekegram, Pokhran Road No.1, Thane (West), Maharashtra",
    },
    {
      name: "Arvind Mills Garments Div",
      contactPerson: "Sanjay Lalbhai",
      email: "procurement@arvindlifestyle.com",
      phone: "+91 79 6826 4000",
      address: "Naroda Road, Ahmedabad, Gujarat",
    },
    {
      name: "Madura Fashion & Brands (Aditya Birla)",
      contactPerson: "Ashish Dikshit",
      email: "buyer@madurafashions.com",
      phone: "+91 80 6727 1000",
      address: "Piramal Agastya Park, Kurla (W), Mumbai",
    },
    {
      name: "Page Industries (Jockey India)",
      contactPerson: "V. Ganesh",
      email: "rawmaterials@pageind.com",
      phone: "+91 80 4945 4545",
      address: "Umiya Business Bay, Outer Ring Rd, Bengaluru",
    },
    {
      name: "Zodiac Clothing Company",
      contactPerson: "Salman Noorani",
      email: "shirting@zodiacmtc.com",
      phone: "+91 22 6667 7000",
      address: "Nirlon Complex, Goregaon (East), Mumbai",
    },
    {
      name: "Eastman Exports Global",
      contactPerson: "Subramaniam C.",
      email: "orders@eastmanexports.com",
      phone: "+91 421 430 1234",
      address: "5/9 Kumar Nagar, Tirupur, Tamil Nadu",
    },
  ];

  const buyers: Record<number, string> = {};
  let bIdx = 1;
  for (const b of buyersData) {
    let buyerId: string;
    const existing = await prisma.buyer.findFirst({ where: { name: b.name } });
    if (existing) {
      buyerId = existing.id;
    } else {
      const created = await prisma.buyer.create({
        data: { ...b, active: true },
      });
      buyerId = created.id;
    }
    buyers[bIdx] = buyerId;

    // Seed Buyer login user: buyer1@buyers.test ... buyer6@buyers.test
    const buyerEmail = `buyer${bIdx}@buyers.test`;
    await prisma.user.upsert({
      where: { email: buyerEmail },
      update: {
        name: `${b.name} Rep`,
        passwordHash: defaultPasswordHash,
        role: Role.BUYER,
        buyerId,
        active: true,
      },
      create: {
        email: buyerEmail,
        name: `${b.name} Rep`,
        passwordHash: defaultPasswordHash,
        role: Role.BUYER,
        buyerId,
        active: true,
      },
    });

    bIdx++;
  }

  // ==========================================================================
  // 3. STAFF USERS (ADMIN, STORE, SUPERVISOR, QC, ACCOUNTS)
  // ==========================================================================
  console.log("👥 Seeding Internal Staff User Logins...");
  const staffUsers = [
    { email: "admin@everestmills.test", name: "Plant Director", role: Role.ADMIN },
    { email: "store@everestmills.test", name: "Murugan (Storekeeper)", role: Role.STORE },
    { email: "supervisor@everestmills.test", name: "Balakrishnan (Shift Supervisor)", role: Role.SUPERVISOR },
    { email: "qc@everestmills.test", name: "Devi (Lead QC Inspector)", role: Role.QC },
    { email: "accounts@everestmills.test", name: "Srinivasan (Factory Accounts)", role: Role.ACCOUNTS },
  ];

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash: defaultPasswordHash,
        role: u.role,
        buyerId: null,
        active: true,
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: defaultPasswordHash,
        role: u.role,
        buyerId: null,
        active: true,
      },
    });
  }

  // ==========================================================================
  // 4. YARN TYPES (8)
  // ==========================================================================
  console.log("🧶 Seeding 8 Yarn Types (Cotton & Poly Blends)...");
  const yarnsData = [
    { type: "30s Combed Cotton", colour: "Raw White", unit: "KG", reorderLevel: 800, ratePerUnit: 290 },
    { type: "40s Combed Compact", colour: "Bleached White", unit: "KG", reorderLevel: 1000, ratePerUnit: 340 },
    { type: "60s Giza Cotton", colour: "Natural Ecru", unit: "KG", reorderLevel: 450, ratePerUnit: 520 },
    { type: "2/80s Micro Modal Cotton", colour: "Optic White", unit: "KG", reorderLevel: 300, ratePerUnit: 680 },
    { type: "150D Polyester Texturized", colour: "Jet Black", unit: "KG", reorderLevel: 600, ratePerUnit: 175 },
    { type: "75D Filament Polyester", colour: "Navy Blue", unit: "KG", reorderLevel: 500, ratePerUnit: 195 },
    { type: "30s Melange Grey 15%", colour: "Heather Grey", unit: "KG", reorderLevel: 700, ratePerUnit: 325 },
    { type: "20s Slub Cotton", colour: "Vintage Olive", unit: "KG", reorderLevel: 550, ratePerUnit: 280 },
  ];

  const yarnIds: string[] = [];
  for (const y of yarnsData) {
    const existing = await prisma.yarnType.findFirst({
      where: { type: y.type, colour: y.colour },
    });
    if (existing) {
      yarnIds.push(existing.id);
    } else {
      const created = await prisma.yarnType.create({
        data: {
          type: y.type,
          colour: y.colour,
          unit: y.unit,
          reorderLevel: new Prisma.Decimal(y.reorderLevel),
          ratePerUnit: new Prisma.Decimal(y.ratePerUnit),
        },
      });
      yarnIds.push(created.id);
    }
  }

  // ==========================================================================
  // 5. BOM (BILL OF MATERIALS) FOR 5 FABRIC TYPES
  // ==========================================================================
  console.log("📐 Seeding BOM specifications for 5 Fabric Types...");
  const bomsData = [
    { fabricType: "Poplin Oxford 40s", yarnIndex: 1, yarnPerMetre: 0.22 },
    { fabricType: "Giza Premium Shirting 60s", yarnIndex: 2, yarnPerMetre: 0.175 },
    { fabricType: "Twill Suiting 30s Cotton", yarnIndex: 0, yarnPerMetre: 0.31 },
    { fabricType: "Heavy Denim Slub 20s", yarnIndex: 7, yarnPerMetre: 0.44 },
    { fabricType: "Micro Weave Poly-Blend 75D", yarnIndex: 5, yarnPerMetre: 0.19 },
  ];

  for (const b of bomsData) {
    const yarnTypeId = yarnIds[b.yarnIndex];
    await prisma.bOM.upsert({
      where: {
        fabricType_yarnTypeId: {
          fabricType: b.fabricType,
          yarnTypeId,
        },
      },
      update: {
        yarnPerMetre: new Prisma.Decimal(b.yarnPerMetre),
      },
      create: {
        fabricType: b.fabricType,
        yarnTypeId,
        yarnPerMetre: new Prisma.Decimal(b.yarnPerMetre),
      },
    });
  }

  // ==========================================================================
  // 6. MACHINES (14) ACROSS SPINNING, WEAVING, DYEING
  // ==========================================================================
  console.log("⚙️ Seeding 14 Industrial Machines across stages...");
  const machinesData = [
    // SPINNING (4)
    { code: "SP-01", name: "Rieter Ring Frame #1", type: MachineType.SPINNING, status: MachineStatus.RUNNING, hourlyOverhead: 180, capacityPerHour: 45 },
    { code: "SP-02", name: "Rieter Ring Frame #2", type: MachineType.SPINNING, status: MachineStatus.RUNNING, hourlyOverhead: 180, capacityPerHour: 45 },
    { code: "SP-03", name: "LMW Compact Spinner", type: MachineType.SPINNING, status: MachineStatus.IDLE, hourlyOverhead: 210, capacityPerHour: 55 },
    { code: "SP-04", name: "Vortex Air-Jet Spinner", type: MachineType.SPINNING, status: MachineStatus.MAINTENANCE, hourlyOverhead: 240, capacityPerHour: 70 },
    // WEAVING (6)
    { code: "WV-01", name: "Tsudakoma Airjet Loom #1", type: MachineType.WEAVING, status: MachineStatus.RUNNING, hourlyOverhead: 150, capacityPerHour: 65 },
    { code: "WV-02", name: "Tsudakoma Airjet Loom #2", type: MachineType.WEAVING, status: MachineStatus.RUNNING, hourlyOverhead: 150, capacityPerHour: 65 },
    { code: "WV-03", name: "Toyota JAT810 Airjet", type: MachineType.WEAVING, status: MachineStatus.RUNNING, hourlyOverhead: 165, capacityPerHour: 75 },
    { code: "WV-04", name: "Picanol OmniPlus Summum", type: MachineType.WEAVING, status: MachineStatus.BREAKDOWN, hourlyOverhead: 175, capacityPerHour: 80 },
    { code: "WV-05", name: "Picanol OptiMax Rapier", type: MachineType.WEAVING, status: MachineStatus.IDLE, hourlyOverhead: 140, capacityPerHour: 50 },
    { code: "WV-06", name: "Smit GS900 Rapier Loom", type: MachineType.WEAVING, status: MachineStatus.RUNNING, hourlyOverhead: 135, capacityPerHour: 48 },
    // DYEING (4)
    { code: "DY-01", name: "Fong's High Temp Jigger #1", type: MachineType.DYEING, status: MachineStatus.RUNNING, hourlyOverhead: 320, capacityPerHour: 120 },
    { code: "DY-02", name: "Fong's High Temp Jigger #2", type: MachineType.DYEING, status: MachineStatus.RUNNING, hourlyOverhead: 320, capacityPerHour: 120 },
    { code: "DY-03", name: "Thies Soft-TRD Jet Dyer", type: MachineType.DYEING, status: MachineStatus.IDLE, hourlyOverhead: 350, capacityPerHour: 140 },
    { code: "DY-04", name: "Monforts Stenter Machine", type: MachineType.DYEING, status: MachineStatus.RUNNING, hourlyOverhead: 420, capacityPerHour: 200 },
  ];

  const machineMap: Record<string, string> = {};
  for (const m of machinesData) {
    const upserted = await prisma.machine.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        type: m.type,
        status: m.status,
        hourlyOverhead: new Prisma.Decimal(m.hourlyOverhead),
        capacityPerHour: new Prisma.Decimal(m.capacityPerHour),
      },
      create: {
        code: m.code,
        name: m.name,
        type: m.type,
        status: m.status,
        hourlyOverhead: new Prisma.Decimal(m.hourlyOverhead),
        capacityPerHour: new Prisma.Decimal(m.capacityPerHour),
      },
    });
    machineMap[m.code] = upserted.id;
  }

  // ==========================================================================
  // 7. WORKERS (20) & 30 DAYS ATTENDANCE
  // ==========================================================================
  console.log("👷 Seeding 20 Factory Workers & 30 days of attendance logs...");
  const workersData = [
    { name: "Arumugam Palanisamy", code: "WRK-001", role: "Master Weaver", phone: "+91 97891 12301", dailyRate: 750, otRatePerHour: 95 },
    { name: "Kandasamy Velusamy", code: "WRK-002", role: "Loom Technician", phone: "+91 97891 12302", dailyRate: 720, otRatePerHour: 90 },
    { name: "Selvaraj Muthusamy", code: "WRK-003", role: "Weaver", phone: "+91 97891 12303", dailyRate: 650, otRatePerHour: 85 },
    { name: "Ponnusamy Ramasamy", code: "WRK-004", role: "Weaver", phone: "+91 97891 12304", dailyRate: 650, otRatePerHour: 85 },
    { name: "Vellingiri Subramani", code: "WRK-005", role: "Weaver", phone: "+91 97891 12305", dailyRate: 640, otRatePerHour: 80 },
    { name: "Ramesh Krishnan", code: "WRK-006", role: "Spinning Operator", phone: "+91 97891 12306", dailyRate: 620, otRatePerHour: 80 },
    { name: "Suresh Narayanan", code: "WRK-007", role: "Spinning Operator", phone: "+91 97891 12307", dailyRate: 620, otRatePerHour: 80 },
    { name: "Manickam Periyasamy", code: "WRK-008", role: "Ring Frame Tender", phone: "+91 97891 12308", dailyRate: 600, otRatePerHour: 75 },
    { name: "Govindasamy Raju", code: "WRK-009", role: "Dyeing Master", phone: "+91 97891 12309", dailyRate: 850, otRatePerHour: 110 },
    { name: "Thangavel Sengottaiyan", code: "WRK-010", role: "Dyeing Operator", phone: "+91 97891 12310", dailyRate: 680, otRatePerHour: 85 },
    { name: "Karthi Murugesan", code: "WRK-011", role: "Dyeing Assistant", phone: "+91 97891 12311", dailyRate: 580, otRatePerHour: 75 },
    { name: "Mani Shanmugam", code: "WRK-012", role: "Sizing Operator", phone: "+91 97891 12312", dailyRate: 660, otRatePerHour: 85 },
    { name: "Balamurugan Chinnasamy", code: "WRK-013", role: "Warping Operator", phone: "+91 97891 12313", dailyRate: 660, otRatePerHour: 85 },
    { name: "Sundaram Nallathambi", code: "WRK-014", role: "Fabric Inspector", phone: "+91 97891 12314", dailyRate: 700, otRatePerHour: 90 },
    { name: "Senthilkumar Duraisamy", code: "WRK-015", role: "Roll Packing Specialist", phone: "+91 97891 12315", dailyRate: 580, otRatePerHour: 75 },
    { name: "Pravin Rajagopal", code: "WRK-016", role: "Maintenance Electrician", phone: "+91 97891 12316", dailyRate: 780, otRatePerHour: 100 },
    { name: "Saravanan Natarajan", code: "WRK-017", role: "Mechanical Fitter", phone: "+91 97891 12317", dailyRate: 750, otRatePerHour: 95 },
    { name: "Velumani Thangaraj", code: "WRK-018", role: "Weaver", phone: "+91 97891 12318", dailyRate: 640, otRatePerHour: 80 },
    { name: "Ganesan Marimuthu", code: "WRK-019", role: "Yarn Handler", phone: "+91 97891 12319", dailyRate: 550, otRatePerHour: 70 },
    { name: "Vijayakumar Govindan", code: "WRK-020", role: "Floor Helper", phone: "+91 97891 12320", dailyRate: 520, otRatePerHour: 65 },
  ];

  const workerIds: string[] = [];
  for (const w of workersData) {
    const upserted = await prisma.worker.upsert({
      where: { code: w.code },
      update: {
        name: w.name,
        role: w.role,
        phone: w.phone,
        dailyRate: new Prisma.Decimal(w.dailyRate),
        otRatePerHour: new Prisma.Decimal(w.otRatePerHour),
        active: true,
      },
      create: {
        code: w.code,
        name: w.name,
        role: w.role,
        phone: w.phone,
        dailyRate: new Prisma.Decimal(w.dailyRate),
        otRatePerHour: new Prisma.Decimal(w.otRatePerHour),
        active: true,
      },
    });
    workerIds.push(upserted.id);
  }

  // 30 Days Attendance for first 5 workers (sample dense history)
  const now = new Date();
  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const attDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    // Strip time for Date column
    const dateOnly = new Date(attDate.toISOString().split("T")[0]);

    for (let w = 0; w < 5; w++) {
      const isPresent = (dayOffset + w) % 7 !== 0; // Off every 7th day
      const ot = isPresent && (dayOffset % 3 === 0) ? 2 : 0;
      await prisma.attendance.upsert({
        where: {
          workerId_date_shift: {
            workerId: workerIds[w],
            date: dateOnly,
            shift: Shift.A,
          },
        },
        update: {
          present: isPresent,
          hours: isPresent ? new Prisma.Decimal(8) : new Prisma.Decimal(0),
          overtimeHours: new Prisma.Decimal(ot),
        },
        create: {
          workerId: workerIds[w],
          date: dateOnly,
          shift: Shift.A,
          present: isPresent,
          hours: isPresent ? new Prisma.Decimal(8) : new Prisma.Decimal(0),
          overtimeHours: new Prisma.Decimal(ot),
        },
      });
    }
  }

  // ==========================================================================
  // 8. 30 DAYS STOCK MOVEMENTS (TWO YARNS BELOW REORDER LEVEL)
  // ==========================================================================
  console.log("📊 Seeding 30 Days of Stock Movements & Reorder Alerts...");
  // Clear non-critical existing test stock movements to keep exact known inventory balance
  await prisma.stockMovement.deleteMany({});

  // Yarn 0 (30s Combed Cotton, reorderLevel=800): Net 650 kg -> BELOW REORDER LEVEL
  await prisma.stockMovement.create({
    data: {
      yarnTypeId: yarnIds[0],
      qty: new Prisma.Decimal(2500),
      reason: StockMovementReason.RECEIPT,
      note: "Initial warehouse bulk shipment GRN-0101",
      createdAt: new Date(now.getTime() - 28 * 86400000),
    },
  });
  await prisma.stockMovement.create({
    data: {
      yarnTypeId: yarnIds[0],
      qty: new Prisma.Decimal(-1850),
      reason: StockMovementReason.ISSUE,
      note: "Bulk floor issue for suiting production WO-101",
      createdAt: new Date(now.getTime() - 5 * 86400000),
    },
  });

  // Yarn 4 (150D Poly, reorderLevel=600): Net 420 kg -> BELOW REORDER LEVEL
  await prisma.stockMovement.create({
    data: {
      yarnTypeId: yarnIds[4],
      qty: new Prisma.Decimal(1200),
      reason: StockMovementReason.RECEIPT,
      note: "Vendor batch delivery PO-401",
      createdAt: new Date(now.getTime() - 25 * 86400000),
    },
  });
  await prisma.stockMovement.create({
    data: {
      yarnTypeId: yarnIds[4],
      qty: new Prisma.Decimal(-780),
      reason: StockMovementReason.ISSUE,
      note: "Issue to Weaving Frame WV-02",
      createdAt: new Date(now.getTime() - 2 * 86400000),
    },
  });

  // Other yarns have healthy stock
  for (let i = 1; i < yarnIds.length; i++) {
    if (i === 4) continue;
    await prisma.stockMovement.create({
      data: {
        yarnTypeId: yarnIds[i],
        qty: new Prisma.Decimal(3000),
        reason: StockMovementReason.RECEIPT,
        note: `Routine factory delivery for ${yarnsData[i].type}`,
        createdAt: new Date(now.getTime() - (20 - i) * 86400000),
      },
    });
  }

  // ==========================================================================
  // 9. ORDERS (12) ACROSS ALL STATUSES, WORK ORDERS & PRODUCTION LOGS
  // ==========================================================================
  console.log("📑 Seeding 12 Textile Orders across all lifecycle statuses...");
  const orderConfigs = [
    { no: "ORD-2026-001", buyer: buyers[1], fabric: "Poplin Oxford 40s", colour: "Sky Blue", qty: 2500, rate: 165, st: OrderStatus.CONFIRMED },
    { no: "ORD-2026-002", buyer: buyers[2], fabric: "Giza Premium Shirting 60s", colour: "Optic White", qty: 1800, rate: 280, st: OrderStatus.CONFIRMED },
    { no: "ORD-2026-003", buyer: buyers[3], fabric: "Twill Suiting 30s Cotton", colour: "Navy Melange", qty: 3200, rate: 210, st: OrderStatus.IN_PRODUCTION },
    { no: "ORD-2026-004", buyer: buyers[4], fabric: "Heavy Denim Slub 20s", colour: "Indigo Classic", qty: 4000, rate: 245, st: OrderStatus.IN_PRODUCTION },
    { no: "ORD-2026-005", buyer: buyers[5], fabric: "Micro Weave Poly-Blend 75D", colour: "Steel Charcoal", qty: 1500, rate: 140, st: OrderStatus.IN_PRODUCTION },
    { no: "ORD-2026-006", buyer: buyers[6], fabric: "Poplin Oxford 40s", colour: "Classic White", qty: 2200, rate: 170, st: OrderStatus.QC },
    { no: "ORD-2026-007", buyer: buyers[1], fabric: "Giza Premium Shirting 60s", colour: "Soft Lavender", qty: 1200, rate: 295, st: OrderStatus.QC },
    { no: "ORD-2026-008", buyer: buyers[2], fabric: "Twill Suiting 30s Cotton", colour: "Olive Khaki", qty: 2800, rate: 215, st: OrderStatus.READY },
    { no: "ORD-2026-009", buyer: buyers[3], fabric: "Heavy Denim Slub 20s", colour: "Washed Black", qty: 3500, rate: 255, st: OrderStatus.READY },
    { no: "ORD-2026-010", buyer: buyers[4], fabric: "Poplin Oxford 40s", colour: "Butter Yellow", qty: 2000, rate: 165, st: OrderStatus.DISPATCHED },
    { no: "ORD-2026-011", buyer: buyers[5], fabric: "Giza Premium Shirting 60s", colour: "Royal Blue", qty: 1600, rate: 285, st: OrderStatus.DISPATCHED },
    { no: "ORD-2026-012", buyer: buyers[6], fabric: "Micro Weave Poly-Blend 75D", colour: "Crimson Red", qty: 1000, rate: 145, st: OrderStatus.CANCELLED },
  ];

  const orderMap: Record<string, string> = {};
  for (const o of orderConfigs) {
    const deadline = new Date(now.getTime() + 14 * 86400000);
    const upserted = await prisma.order.upsert({
      where: { orderNo: o.no },
      update: {
        buyerId: o.buyer,
        fabricType: o.fabric,
        colour: o.colour,
        qtyMetres: new Prisma.Decimal(o.qty),
        ratePerMetre: new Prisma.Decimal(o.rate),
        status: o.st,
        deadline,
      },
      create: {
        orderNo: o.no,
        buyerId: o.buyer,
        fabricType: o.fabric,
        colour: o.colour,
        qtyMetres: new Prisma.Decimal(o.qty),
        ratePerMetre: new Prisma.Decimal(o.rate),
        status: o.st,
        deadline,
      },
    });
    orderMap[o.no] = upserted.id;
  }

  // Work Orders & Logs for IN_PRODUCTION, QC, READY, DISPATCHED orders
  const activeOrders = ["ORD-2026-003", "ORD-2026-004", "ORD-2026-006", "ORD-2026-008", "ORD-2026-010"];
  const workOrderIds: string[] = [];

  for (const oNo of activeOrders) {
    const oId = orderMap[oNo];
    const wo = await prisma.workOrder.create({
      data: {
        orderId: oId,
        stage: ProductionStage.WEAVING,
        machineId: machineMap["WV-01"],
        targetQty: new Prisma.Decimal(2000),
        producedQty: new Prisma.Decimal(1850),
        status: WorkOrderStatus.RUNNING,
        startedAt: new Date(now.getTime() - 4 * 86400000),
      },
    });
    workOrderIds.push(wo.id);

    await prisma.productionLog.create({
      data: {
        workOrderId: wo.id,
        qty: new Prisma.Decimal(925),
        hours: new Prisma.Decimal(12),
        shift: Shift.A,
        createdAt: new Date(now.getTime() - 2 * 86400000),
      },
    });
    await prisma.productionLog.create({
      data: {
        workOrderId: wo.id,
        qty: new Prisma.Decimal(925),
        hours: new Prisma.Decimal(12),
        shift: Shift.B,
        createdAt: new Date(now.getTime() - 1 * 86400000),
      },
    });
  }

  // ==========================================================================
  // 10. ~90 ROLLS WITH MIX OF QC OUTCOMES (PASSED, REWORK, REJECTED, PENDING)
  // ==========================================================================
  console.log("🧵 Seeding ~90 Fabric Rolls with QC inspection results...");
  const qcDistributions: QCStatus[] = [
    QCStatus.PASSED,
    QCStatus.PASSED,
    QCStatus.PASSED,
    QCStatus.PASSED,
    QCStatus.PASSED,
    QCStatus.PASSED,
    QCStatus.REWORK,
    QCStatus.REJECTED,
    QCStatus.PENDING,
  ];

  const rollMap: Record<number, string> = {};
  for (let r = 1; r <= 90; r++) {
    const rollNo = `RL-${String(r).padStart(4, "0")}`;
    const targetOrderNo = activeOrders[(r % activeOrders.length)];
    const targetOrderId = orderMap[targetOrderNo];
    const qc = qcDistributions[r % qcDistributions.length];
    const length = 80 + (r % 40);

    const roll = await prisma.roll.upsert({
      where: { rollNo },
      update: {
        orderId: targetOrderId,
        workOrderId: workOrderIds[r % workOrderIds.length],
        machineId: machineMap["WV-01"],
        lengthM: new Prisma.Decimal(length),
        qcStatus: qc,
      },
      create: {
        rollNo,
        orderId: targetOrderId,
        workOrderId: workOrderIds[r % workOrderIds.length],
        machineId: machineMap["WV-01"],
        lengthM: new Prisma.Decimal(length),
        qcStatus: qc,
      },
    });
    rollMap[r] = roll.id;

    // Create QC inspection record if already tested
    if (qc !== QCStatus.PENDING) {
      await prisma.qCInspection.create({
        data: {
          rollId: roll.id,
          result: qc,
          severity: qc === QCStatus.PASSED ? "NONE" : qc === QCStatus.REWORK ? "MINOR" : "MAJOR",
          defects: qc === QCStatus.PASSED ? [] : [{ type: "WARP_FLOAT", points: 4 }],
          notes: qc === QCStatus.PASSED ? "Meets export fabric standard" : "Shade bar variation observed",
        },
      });
    }
  }

  // ==========================================================================
  // 11. 3 DISPATCHES, INVOICES & PARTIAL PAYMENTS
  // ==========================================================================
  console.log("🚚 Seeding 3 Dispatches, Invoices & Partial Payments...");
  const dispatchConfigs = [
    {
      no: "DSP-2026-001",
      orderNo: "ORD-2026-010",
      invNo: "INV-2026-001",
      veh: "TN 38 BH 4521",
      drv: "Murugan Selvam",
      sub: 330000,
      tax: 5,
      tot: 346500,
      invSt: InvoiceStatus.PARTIAL,
      pay: 200000,
      rollsRange: [1, 5],
    },
    {
      no: "DSP-2026-002",
      orderNo: "ORD-2026-011",
      invNo: "INV-2026-002",
      veh: "TN 33 DA 8820",
      drv: "Kannan Natarajan",
      sub: 456000,
      tax: 5,
      tot: 478800,
      invSt: InvoiceStatus.PAID,
      pay: 478800,
      rollsRange: [6, 10],
    },
    {
      no: "DSP-2026-003",
      orderNo: "ORD-2026-008",
      invNo: "INV-2026-003",
      veh: "TN 37 CQ 1984",
      drv: "Praveen Kumar",
      sub: 215000,
      tax: 5,
      tot: 225750,
      invSt: InvoiceStatus.UNPAID,
      pay: 0,
      rollsRange: [11, 15],
    },
  ];

  for (const d of dispatchConfigs) {
    const oId = orderMap[d.orderNo];

    const dispatch = await prisma.dispatch.upsert({
      where: { dispatchNo: d.no },
      update: {
        orderId: oId,
        vehicleNo: d.veh,
        driver: d.drv,
        dispatchedAt: new Date(now.getTime() - 2 * 86400000),
      },
      create: {
        dispatchNo: d.no,
        orderId: oId,
        vehicleNo: d.veh,
        driver: d.drv,
        dispatchedAt: new Date(now.getTime() - 2 * 86400000),
      },
    });

    // Link rolls to dispatch & create dispatch lines
    for (let r = d.rollsRange[0]; r <= d.rollsRange[1]; r++) {
      const rId = rollMap[r];
      await prisma.roll.update({
        where: { id: rId },
        data: { dispatchId: dispatch.id },
      });
      await prisma.dispatchLine.upsert({
        where: { rollId: rId },
        update: { dispatchId: dispatch.id },
        create: { dispatchId: dispatch.id, rollId: rId },
      });
    }

    // Invoice
    const invoice = await prisma.invoice.upsert({
      where: { invoiceNo: d.invNo },
      update: {
        dispatchId: dispatch.id,
        subtotal: new Prisma.Decimal(d.sub),
        taxPct: new Prisma.Decimal(d.tax),
        total: new Prisma.Decimal(d.tot),
        status: d.invSt,
      },
      create: {
        invoiceNo: d.invNo,
        dispatchId: dispatch.id,
        subtotal: new Prisma.Decimal(d.sub),
        taxPct: new Prisma.Decimal(d.tax),
        total: new Prisma.Decimal(d.tot),
        status: d.invSt,
      },
    });

    // Payment if applicable
    if (d.pay > 0) {
      await prisma.payment.deleteMany({ where: { invoiceId: invoice.id } });
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(d.pay),
          method: "RTGS_TRANSFER",
          paidAt: new Date(now.getTime() - 1 * 86400000),
        },
      });
    }
  }

  // ==========================================================================
  // 12. OPERATIONAL EXPENSES
  // ==========================================================================
  console.log("💰 Seeding Operational Mill Expenses...");
  const expensesData = [
    { category: "ELECTRICITY", amount: 48500, note: "TNEB HT Industrial Power Bill - Weaving Shed", date: new Date(now.getTime() - 10 * 86400000) },
    { category: "MAINTENANCE", amount: 14200, note: "Picanol Loom Rapier Tape & Guide Replacement", date: new Date(now.getTime() - 6 * 86400000) },
    { category: "CONSUMABLES", amount: 9800, note: "Loom Lubricants, Spindle Oil & Size Wax", date: new Date(now.getTime() - 4 * 86400000) },
    { category: "TRANSPORT", amount: 16500, note: "Diesel freight charges for Yarn Receipt Batch #40", date: new Date(now.getTime() - 2 * 86400000) },
  ];

  for (const exp of expensesData) {
    const existing = await prisma.expense.findFirst({
      where: { category: exp.category, note: exp.note },
    });
    if (!existing) {
      await prisma.expense.create({
        data: {
          category: exp.category,
          amount: new Prisma.Decimal(exp.amount),
          note: exp.note,
          date: exp.date,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
