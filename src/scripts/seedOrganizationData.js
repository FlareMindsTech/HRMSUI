
/**
 * Production-Grade Seeder Script for TeamHub HRMS
 * Sets up Organization, Default Roles, Analyzed Permissions, Branches,
 * Departments, Designations, Branch Members, and Reporting Hierarchy.
 *
 * Password for all test users: Pass123
 */

const path = require("path");
const serverModules = "/home/vicky/flareminds/HRMS/HRMS_SERVER/node_modules";
const mongoose = require(path.join(serverModules, "mongoose"));
const bcrypt = require(path.join(serverModules, "bcrypt"));

const MONGO_URI = "mongodb+srv://root:root@vignesh.q1mip.mongodb.net/HRMS";
const DEFAULT_PASSWORD = "Pass123";

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully.\n");

  const db = mongoose.connection.db;
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ─────────────────────────────────────────────────────────────
  // 1. ORGANIZATION SETUP
  // ─────────────────────────────────────────────────────────────
  console.log("1. Setting up Organization...");
  let org = await db.collection("organizations").findOne({});
  const orgData = {
    organizationName: "FlareMinds Technologies",
    legalName: "FlareMinds Technologies Private Limited",
    displayName: "FlareMinds Technologies",
    organizationCode: "FMT",
    organizationType: "COMPANY",
    industry: "Information Technology & Services",
    website: "https://flareminds.com",
    email: "contact@flareminds.com",
    phone: "9876543210",
    address: "123 Cotton City Tech Park, 4th Floor",
    city: "Tiruppur",
    state: "Tamil Nadu",
    country: "India",
    pincode: "641604",
    currency: "INR",
    timeZone: "Asia/Kolkata",
    financialYearStart: "04-01",
    status: "ACTIVE",
    setupStatus: "COMPLETED",
    subscriptionPlan: "PAID",
    subscriptionStatus: "ACTIVE",
    subscriptionStartedAt: new Date(),
    subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    featureLimits: {
      maxEmployees: 100,
      maxBranches: 10,
      maxStorageMB: 20480,
      maxAdmins: 10,
      maxProjects: 50,
    },
    updatedAt: new Date(),
  };

  if (!org) {
    orgData.createdAt = new Date();
    const insertRes = await db.collection("organizations").insertOne(orgData);
    org = { _id: insertRes.insertedId, ...orgData };
  } else {
    await db.collection("organizations").updateOne({ _id: org._id }, { $set: orgData });
    org = { ...org, ...orgData };
  }
  const orgId = org._id;
  console.log(`✓ Organization active: ${org.organizationName} (${orgId})\n`);

  // ─────────────────────────────────────────────────────────────
  // 2. ROLES & PERMISSION ANALYSIS
  // ─────────────────────────────────────────────────────────────
  console.log("2. Analyzing & Mapping Default Roles and Permissions...");
  const rolesCollection = db.collection("roles");
  const permissionsCollection = db.collection("permissions");
  const menusCollection = db.collection("menus");
  const rolePermissionsCollection = db.collection("rolepermissions");
  const roleMenusCollection = db.collection("rolemenus");

  const allPerms = await permissionsCollection.find({}).toArray();
  const allMenus = await menusCollection.find({}).toArray();

  const roleConfigs = [
    {
      roleName: "Owner",
      roleCode: "OWNER",
      priority: 1,
      isSystemRole: true,
      description: "Full administrative ownership across all organization modules and settings.",
      menuCodes: [
        "DASHBOARD",
        "ORGANISATION",
        "USER_MANAGEMENT",
        "ROLE_MANAGEMENT",
        "PROJECTS",
        "ATTENDANCE",
        "LEAVE_MGMT",
        "PAYSLIP",
        "ASSETS",
        "REIMBURSEMENT",
      ],
      permFilter: () => true, // ALL 131 permissions
    },
    {
      roleName: "Admin",
      roleCode: "ADMIN",
      priority: 2,
      isSystemRole: true,
      description: "Full administration rights across organization workspaces, users, and masters.",
      menuCodes: [
        "DASHBOARD",
        "ORGANISATION",
        "USER_MANAGEMENT",
        "ROLE_MANAGEMENT",
        "PROJECTS",
        "ATTENDANCE",
        "LEAVE_MGMT",
        "PAYSLIP",
        "ASSETS",
        "REIMBURSEMENT",
      ],
      permFilter: (p) => !p.permissionCode?.startsWith("platform."),
    },
    {
      roleName: "HR",
      roleCode: "HR",
      priority: 3,
      isSystemRole: true,
      description: "Human resources, staff onboarding, leave policies, attendance, and branch directory.",
      menuCodes: [
        "DASHBOARD",
        "ORGANISATION",
        "USER_MANAGEMENT",
        "ATTENDANCE",
        "LEAVE_MGMT",
        "PAYSLIP",
        "ASSETS",
        "REIMBURSEMENT",
      ],
      permFilter: (p) =>
        [
          "ORGANIZATION",
          "USER_MANAGEMENT",
          "LEAVE_MGMT",
          "ATTENDANCE",
          "ASSET",
          "REIMBURSEMENT",
        ].includes(p.module),
    },
    {
      roleName: "Project Manager",
      roleCode: "PROJECT_MANAGER",
      priority: 4,
      isSystemRole: true,
      description: "Team leadership, sprint planning, direct line hierarchy, and team leave approvals.",
      menuCodes: [
        "DASHBOARD",
        "ORGANISATION",
        "PROJECTS",
        "ATTENDANCE",
        "LEAVE_MGMT",
        "REIMBURSEMENT",
      ],
      permFilter: (p) =>
        p.module === "PROJECTS" ||
        p.permissionCode?.startsWith("reportinghierarchy.") ||
        p.permissionCode?.startsWith("team.") ||
        p.permissionCode?.startsWith("organization.view") ||
        p.permissionCode?.startsWith("branch.view") ||
        p.permissionCode?.startsWith("department.view") ||
        p.permissionCode?.startsWith("designation.view") ||
        p.permissionCode?.includes("read.team") ||
        p.permissionCode?.includes("approval"),
    },
    {
      roleName: "Employee",
      roleCode: "EMPLOYEE",
      priority: 5,
      isSystemRole: true,
      description: "Standard employee self-service: directories, own attendance, leaves, and profile.",
      menuCodes: ["DASHBOARD", "ORGANISATION", "ATTENDANCE", "LEAVE_MGMT", "PAYSLIP"],
      permFilter: (p) =>
        p.permissionCode?.endsWith(".view") ||
        p.permissionCode?.endsWith(".read") ||
        p.permissionCode?.includes(".read.own") ||
        p.permissionCode?.includes("punch_") ||
        p.permissionCode?.includes("apply"),
    },
  ];

  const roleMap = new Map();

  for (const cfg of roleConfigs) {
    let r = await rolesCollection.findOne({ roleCode: cfg.roleCode });
    if (!r) {
      const ins = await rolesCollection.insertOne({
        roleName: cfg.roleName,
        roleCode: cfg.roleCode,
        priority: cfg.priority,
        isSystemRole: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      r = { _id: ins.insertedId, ...cfg };
    }
    roleMap.set(cfg.roleCode, r._id);

    // Sync Role Menus
    const matchingMenus = allMenus.filter((m) => cfg.menuCodes.includes(m.menuCode));
    for (const menu of matchingMenus) {
      await roleMenusCollection.updateOne(
        { roleId: r._id, menuId: menu._id },
        {
          $set: {
            roleId: r._id,
            menuId: menu._id,
            organizationId: orgId,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    // Sync Role Permissions
    const matchingPerms = allPerms.filter(cfg.permFilter);
    for (const perm of matchingPerms) {
      await rolePermissionsCollection.updateOne(
        { roleId: r._id, permissionId: perm._id },
        {
          $set: {
            roleId: r._id,
            permissionId: perm._id,
            organizationId: orgId,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }
    console.log(`  ✓ Configured role: ${cfg.roleName} (${matchingPerms.length} permissions, ${matchingMenus.length} menus)`);
  }
  console.log("");

  // ─────────────────────────────────────────────────────────────
  // 3. BRANCHES (Head Office + Tech Hub + Regional Branch)
  // ─────────────────────────────────────────────────────────────
  console.log("3. Setting up Branches...");
  const branchesCollection = db.collection("branches");

  const branchDefinitions = [
    {
      branchName: "Head Office - Tiruppur",
      branchCode: "HQ",
      branchType: "HEAD_OFFICE",
      email: "hq@flareminds.com",
      phone: "9876543210",
      address: "123 Cotton City Tech Park, 4th Floor",
      city: "Tiruppur",
      state: "Tamil Nadu",
      country: "India",
      pincode: "641604",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "09:00", end: "18:00" },
      status: "ACTIVE",
    },
    {
      branchName: "Innovation Hub - Bangalore",
      branchCode: "BLR",
      branchType: "BRANCH",
      email: "bangalore@flareminds.com",
      phone: "9876543211",
      address: "45 Outer Ring Road, Bellandur",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560103",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "09:30", end: "18:30" },
      status: "ACTIVE",
    },
    {
      branchName: "Regional Office - Chennai",
      branchCode: "MAA",
      branchType: "BRANCH",
      email: "chennai@flareminds.com",
      phone: "9876543212",
      address: "78 OMR IT Highway, Taramani",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "600113",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "09:00", end: "18:00" },
      status: "ACTIVE",
    },
  ];

  const branchMap = new Map();
  for (const bDef of branchDefinitions) {
    let b = await branchesCollection.findOne({
      organizationId: orgId,
      branchCode: bDef.branchCode,
    });
    if (!b) {
      const ins = await branchesCollection.insertOne({
        ...bDef,
        organizationId: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      b = { _id: ins.insertedId, ...bDef };
    } else {
      await branchesCollection.updateOne({ _id: b._id }, { $set: { ...bDef, updatedAt: new Date() } });
    }
    branchMap.set(bDef.branchCode, b._id);
    console.log(`  ✓ Branch ready: ${bDef.branchName} (${bDef.branchCode})`);
  }
  console.log("");

  // ─────────────────────────────────────────────────────────────
  // 4. DEPARTMENTS SETUP
  // ─────────────────────────────────────────────────────────────
  console.log("4. Setting up Departments & Hierarchies...");
  const deptsCollection = db.collection("departments");

  const deptDefs = [
    { departmentName: "Executive & Board", departmentCode: "EXEC", parentCode: null },
    { departmentName: "Engineering & Technology", departmentCode: "ENG", parentCode: null },
    { departmentName: "Cloud & Site Reliability", departmentCode: "DEVOPS", parentCode: "ENG" },
    { departmentName: "Quality Assurance & Testing", departmentCode: "QA", parentCode: "ENG" },
    { departmentName: "Product & UI/UX Design", departmentCode: "PROD", parentCode: null },
    { departmentName: "Human Resources & Talent", departmentCode: "HR", parentCode: null },
    { departmentName: "Finance & Accounts", departmentCode: "FIN", parentCode: null },
    { departmentName: "Sales & Client Solutions", departmentCode: "SALES", parentCode: null },
  ];

  const deptMap = new Map();
  // First pass: create root departments
  for (const dDef of deptDefs.filter((d) => !d.parentCode)) {
    let d = await deptsCollection.findOne({ organizationId: orgId, departmentCode: dDef.departmentCode });
    if (!d) {
      const ins = await deptsCollection.insertOne({
        organizationId: orgId,
        departmentName: dDef.departmentName,
        departmentCode: dDef.departmentCode,
        parentDepartmentId: null,
        branchId: branchMap.get("HQ"),
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      d = { _id: ins.insertedId };
    }
    deptMap.set(dDef.departmentCode, d._id);
    console.log(`  ✓ Root Department: ${dDef.departmentName} (${dDef.departmentCode})`);
  }

  // Second pass: child departments
  for (const dDef of deptDefs.filter((d) => d.parentCode)) {
    const parentId = deptMap.get(dDef.parentCode);
    let d = await deptsCollection.findOne({ organizationId: orgId, departmentCode: dDef.departmentCode });
    if (!d) {
      const ins = await deptsCollection.insertOne({
        organizationId: orgId,
        departmentName: dDef.departmentName,
        departmentCode: dDef.departmentCode,
        parentDepartmentId: parentId,
        branchId: branchMap.get("HQ"),
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      d = { _id: ins.insertedId };
    }
    deptMap.set(dDef.departmentCode, d._id);
    console.log(`  ✓ Sub-Department: ${dDef.departmentName} (reports to ${dDef.parentCode})`);
  }
  console.log("");

  // ─────────────────────────────────────────────────────────────
  // 5. DESIGNATIONS SETUP
  // ─────────────────────────────────────────────────────────────
  console.log("5. Setting up Designations...");
  const desigCollection = db.collection("designations");

  const desigDefs = [
    { designationName: "Managing Director / CEO", designationCode: "CEO", deptCode: "EXEC" },
    { designationName: "Chief Technology Officer", designationCode: "CTO", deptCode: "ENG" },
    { designationName: "Head of Human Resources", designationCode: "HR_HEAD", deptCode: "HR" },
    { designationName: "Lead Solutions Architect", designationCode: "ARCH_LEAD", deptCode: "ENG" },
    { designationName: "Staff DevOps Engineer", designationCode: "DEVOPS_ENG", deptCode: "DEVOPS" },
    { designationName: "Lead Product Designer", designationCode: "UI_LEAD", deptCode: "PROD" },
    { designationName: "Senior Full Stack Engineer", designationCode: "SR_DEV", deptCode: "ENG" },
    { designationName: "Senior QA Automation Engineer", designationCode: "SR_QA", deptCode: "QA" },
    { designationName: "HR Operations Specialist", designationCode: "HR_SPEC", deptCode: "HR" },
    { designationName: "Software Engineering Intern", designationCode: "INTERN", deptCode: "ENG" },
  ];

  const desigMap = new Map();
  for (const dDef of desigDefs) {
    let desig = await desigCollection.findOne({
      organizationId: orgId,
      designationCode: dDef.designationCode,
    });
    const deptId = deptMap.get(dDef.deptCode) || null;
    if (!desig) {
      const ins = await desigCollection.insertOne({
        organizationId: orgId,
        designationName: dDef.designationName,
        designationCode: dDef.designationCode,
        departmentId: deptId,
        branchId: branchMap.get("HQ"),
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      desig = { _id: ins.insertedId };
    }
    desigMap.set(dDef.designationCode, desig._id);
    console.log(`  ✓ Designation: ${dDef.designationName} (${dDef.designationCode})`);
  }
  console.log("");

  // ─────────────────────────────────────────────────────────────
  // 6. DUMMY MEMBERS (All with Password: Pass123)
  // ─────────────────────────────────────────────────────────────
  console.log("6. Creating / Syncing Dummy Members (Password: Pass123)...");
  const usersCollection = db.collection("users");
  const uoaCollection = db.collection("userorganizationaccesses");

  const dummyMembers = [
    {
      firstName: "Vigneshwaran",
      lastName: "K",
      email: "owner@flareminds.com",
      mobileNo: "9876543201",
      employeeCode: "FMT001",
      roleCode: "OWNER",
      desigCode: "CEO",
      deptCode: "EXEC",
      branchCode: "HQ",
      isOwner: true,
      gender: "Male",
      managerCode: null, // Top Executive Root
    },
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@flareminds.com",
      mobileNo: "9876543202",
      employeeCode: "FMT002",
      roleCode: "ADMIN",
      desigCode: "CTO",
      deptCode: "ENG",
      branchCode: "HQ",
      gender: "Male",
      managerCode: "FMT001",
    },
    {
      firstName: "Priya",
      lastName: "Dharshini",
      email: "hr@flareminds.com",
      mobileNo: "9876543203",
      employeeCode: "FMT003",
      roleCode: "HR",
      desigCode: "HR_HEAD",
      deptCode: "HR",
      branchCode: "HQ",
      gender: "Female",
      managerCode: "FMT001",
    },
    {
      firstName: "Arvind",
      lastName: "Swaminathan",
      email: "techlead@flareminds.com",
      mobileNo: "9876543204",
      employeeCode: "FMT004",
      roleCode: "PROJECT_MANAGER",
      desigCode: "ARCH_LEAD",
      deptCode: "ENG",
      branchCode: "BLR",
      gender: "Male",
      managerCode: "FMT001",
    },
    {
      firstName: "Sneha",
      lastName: "Nair",
      email: "devops@flareminds.com",
      mobileNo: "9876543205",
      employeeCode: "FMT005",
      roleCode: "EMPLOYEE",
      desigCode: "DEVOPS_ENG",
      deptCode: "DEVOPS",
      branchCode: "BLR",
      gender: "Female",
      managerCode: "FMT004",
    },
    {
      firstName: "Karthikeyan",
      lastName: "Ramasamy",
      email: "pm@flareminds.com",
      mobileNo: "9876543206",
      employeeCode: "FMT006",
      roleCode: "PROJECT_MANAGER",
      desigCode: "UI_LEAD",
      deptCode: "PROD",
      branchCode: "HQ",
      gender: "Male",
      managerCode: "FMT001",
    },
    {
      firstName: "Ananya",
      lastName: "Sharma",
      email: "designer@flareminds.com",
      mobileNo: "9876543207",
      employeeCode: "FMT007",
      roleCode: "EMPLOYEE",
      desigCode: "UI_LEAD",
      deptCode: "PROD",
      branchCode: "BLR",
      gender: "Female",
      managerCode: "FMT006",
    },
    {
      firstName: "Rohan",
      lastName: "Verma",
      email: "developer@flareminds.com",
      mobileNo: "9876543208",
      employeeCode: "FMT008",
      roleCode: "EMPLOYEE",
      desigCode: "SR_DEV",
      deptCode: "ENG",
      branchCode: "BLR",
      gender: "Male",
      managerCode: "FMT004",
    },
    {
      firstName: "Meera",
      lastName: "Krishnan",
      email: "qa@flareminds.com",
      mobileNo: "9876543209",
      employeeCode: "FMT009",
      roleCode: "EMPLOYEE",
      desigCode: "SR_QA",
      deptCode: "QA",
      branchCode: "MAA",
      gender: "Female",
      managerCode: "FMT004",
    },
    {
      firstName: "Rahul",
      lastName: "Intern",
      email: "intern@flareminds.com",
      mobileNo: "9876543219",
      employeeCode: "INT001",
      roleCode: "EMPLOYEE",
      desigCode: "INTERN",
      deptCode: "ENG",
      branchCode: "BLR",
      gender: "Male",
      managerCode: "FMT008",
    },
  ];

  const userDocMap = new Map();

  for (const m of dummyMembers) {
    const roleId = roleMap.get(m.roleCode);
    const branchId = branchMap.get(m.branchCode);
    const deptId = deptMap.get(m.deptCode);
    const desigId = desigMap.get(m.desigCode);

    const userPayload = {
      organizationId: orgId,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email.toLowerCase(),
      mobileNo: m.mobileNo,
      employeeCode: m.employeeCode,
      password: hashedPassword,
      role: roleId,
      branchId: branchId,
      assignedBranchIds: [branchId],
      departmentId: deptId,
      designationId: desigId,
      department: m.deptCode,
      designation: m.desigCode,
      hasLoginAccess: true,
      isActive: true,
      isBlocked: false,
      lifecycleStatus: "ACTIVE",
      joiningDate: new Date("2024-01-15"),
      updatedAt: new Date(),
    };

    let user = await usersCollection.findOne({ email: m.email.toLowerCase() });
    if (!user) {
      userPayload.createdAt = new Date();
      const ins = await usersCollection.insertOne(userPayload);
      user = { _id: ins.insertedId, ...userPayload };
    } else {
      await usersCollection.updateOne({ _id: user._id }, { $set: userPayload });
    }
    userDocMap.set(m.employeeCode, user._id);

    // Sync UserOrganizationAccess for Branch Allocation
    await uoaCollection.updateOne(
      { userId: user._id, organizationId: orgId },
      {
        $set: {
          userId: user._id,
          organizationId: orgId,
          roleId: roleId,
          primaryBranchId: branchId,
          branchIds: [branchId],
          accessLevel: "ORGANIZATION",
          status: "ACTIVE",
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          assignedAt: new Date(),
          joinedAt: new Date(),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`  ✓ Member created/updated: ${m.firstName} ${m.lastName} (${m.email} | ${m.employeeCode} | Branch: ${m.branchCode})`);
  }
  console.log("");

  // ─────────────────────────────────────────────────────────────
  // 7. REPORTING HIERARCHY SETUP
  // ─────────────────────────────────────────────────────────────
  console.log("7. Configuring Reporting Hierarchy Tree...");
  const repCollection = db.collection("reportinghierarchies");

  for (const m of dummyMembers) {
    if (!m.managerCode) continue;

    const empId = userDocMap.get(m.employeeCode);
    const mgrId = userDocMap.get(m.managerCode);

    if (empId && mgrId) {
      // Sync in user profile
      await usersCollection.updateOne(
        { _id: empId },
        {
          $set: {
            reportingManagerId: mgrId,
            reportingManager: mgrId,
            reportedTo: mgrId,
          },
        }
      );

      // Upsert in reportinghierarchies
      await repCollection.updateOne(
        { employeeId: empId, managerId: mgrId },
        {
          $set: {
            organizationId: orgId,
            employeeId: empId,
            managerId: mgrId,
            reportingType: "PRIMARY_MANAGER",
            isPrimary: true,
            effectiveFrom: new Date("2024-01-15"),
            status: "ACTIVE",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      console.log(`  ✓ ${m.firstName} (${m.employeeCode}) reports to Manager (${m.managerCode})`);
    }
  }
  console.log("");

  console.log("===============================================================");
  console.log("TESTING DATA SEEDED SUCCESSFULLY FOR ORGANIZATION MODULE!");
  console.log("===============================================================");
  console.log("Default Credentials for All Accounts:");
  console.log("Password: Pass123\n");
  console.log("User Accounts:");
  dummyMembers.forEach((u) => {
    console.log(`- ${u.email.padEnd(26)} | Role: ${u.roleCode.padEnd(16)} | ${u.firstName} ${u.lastName} (${u.employeeCode})`);
  });
  console.log("===============================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
