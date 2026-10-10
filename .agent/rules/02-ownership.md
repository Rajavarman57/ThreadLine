# 02 - Team Ownership & Module Boundaries

| Team Member | Module & Code Paths |
| :--- | :--- |
| **Person A** | • `src/app/(dashboard)/{master,hr,expenses}`<br>• `src/app/portal`<br>• `src/app/track`<br>• `src/components/layout`<br>• `src/services/{master,hr,tracking,expenses}.ts`<br>• `prisma/seed.ts`<br>• `docs` |
| **Person B** | • `src/services/{inventory,orders,procurement,payments}.ts`<br>• `src/app/(dashboard)/{inventory,orders}`<br>• `src/app/api/invoices` |
| **Person C** | • `src/services/{production,quality}.ts`<br>• `src/app/(dashboard)/{production,quality}` |
| **Person D** | • `prisma/schema.prisma`<br>• `src/lib`<br>• `src/app/(auth)`<br>• `middleware.ts`<br>• `.github`<br>• `src/services/{dispatch,finance}.ts`<br>• `src/app/(dashboard)/{dispatch,finance}` |
