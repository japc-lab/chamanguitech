

const bcrypt = require('bcryptjs');

const { Option, Role, RolePermission, User, PaymentInfo, Person, Broker, Client, Size, Company, Period, SizePrice, ShrimpFarm, Purchase, PaymentMethod, PurchasePaymentMethod, Counter, LogisticsItem, Logistics, LogisticsCategory, Sale, CompanySale, CompanySaleItem, LocalSale, LocalSaleDetail, LocalSaleDetailItem } = require('../models');
const Permission = require('../enums/permission.enum');
const SizeTypeEnum = require('../enums/size-type.enum');
const LogisticsCategoryEnum = require('../enums/logistics-category.enum');
const { default: mongoose } = require('mongoose');

const seedDatabase = async (keepTxData = true) => {
    await cleanDatabase(keepTxData);

    await seedOptions();
    const { adminRole, secretariaRole, compradorRole } = await seedRoles();
    await seedPermissions();
    // await seedCompanies(); // Gestión de compañías creado
    await seedSizes();
    await seedPaymentMethods();
    await seedLogisticsCategories();

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync();
    const password = 'ftSQPU3xjgSJU*C';

    if (!keepTxData) {
        // --- Step 1: Create one Person and one User for each role ---
        // 🔹 Admin User
        const adminPerson = await Person.create({
            _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4d01"), // Hardcoded ID
            photo: '',
            names: 'Admin',
            lastNames: 'User',
            identification: 'admin-001',
            birthDate: new Date('1990-01-01'),
            address: '123 Admin St',
            phone: '111-111-1111',
            mobilePhone: '222-222-2222',
            mobilePhone2: '',
            email: 'admin@example.com',
            emergencyContactName: 'Admin Emergency',
            emergencyContactPhone: '333-333-3333',
            paymentInfos: []
        });
        const adminUser = await User.create({
            _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4d02"), // Hardcoded ID
            person: adminPerson._id,
            username: 'admin',
            email: 'admin@example.com',
            password: bcrypt.hashSync(password, salt),
            roles: [adminRole._id]
        });

        // 🔹 Secretaria User
        const secretariaPerson = await Person.create({
            _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4d03"),
            photo: '',
            names: 'Secretaria',
            lastNames: 'User',
            identification: 'secretaria-001',
            birthDate: new Date('1991-01-01'),
            address: '456 Secretaria Ave',
            phone: '444-444-4444',
            mobilePhone: '555-555-5555',
            mobilePhone2: '',
            email: 'secretaria@example.com',
            emergencyContactName: 'Secretaria Emergency',
            emergencyContactPhone: '666-666-6666',
            paymentInfos: []
        });
        const secretariaUser = await User.create({
            _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4d04"),
            person: secretariaPerson._id,
            username: 'secre',
            email: 'secretaria@example.com',
            password: bcrypt.hashSync(password, salt),
            roles: [secretariaRole._id]
        });

        // 🔹 Comprador User
        const compradorPerson = await Person.create({
            _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4d05"),
            photo: '',
            names: 'Comprador',
            lastNames: 'User',
            identification: 'comprador-001',
            birthDate: new Date('1992-01-01'),
            address: '789 Comprador Rd',
            phone: '777-777-7777',
            mobilePhone: '888-888-8888',
            mobilePhone2: '',
            email: 'comprador@example.com',
            emergencyContactName: 'Comprador Emergency',
            emergencyContactPhone: '999-999-9999',
            paymentInfos: []
        });
        const compradorUser = await User.create({
            _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4d06"),
            person: compradorPerson._id,
            username: 'buyer',
            email: 'comprador@example.com',
            password: bcrypt.hashSync(password, salt),
            roles: [compradorRole._id]
        });
    }

    console.log('Seeding process completed');
};

const cleanDatabase = async (keepTxData) => {
    console.log('Cleaning database...');
    if (!keepTxData) {
        await Broker.deleteMany({});
        await Client.deleteMany({});
        await ShrimpFarm.deleteMany({});
        await PaymentInfo.deleteMany({});
        await Person.deleteMany({});
        await User.deleteMany({});
        await Period.deleteMany({});
        await SizePrice.deleteMany({});
        await Counter.deleteMany({});
        await Purchase.deleteMany({});
        await PurchasePaymentMethod.deleteMany({});
        await LogisticsItem.deleteMany({});
        await Logistics.deleteMany({});
        await Sale.deleteMany({});
        await CompanySale.deleteMany({});
        await CompanySaleItem.deleteMany({});
        await LocalSale.deleteMany({});
        await LocalSaleDetail.deleteMany({});
        await LocalSaleDetailItem.deleteMany({});
        await Company.deleteMany({});
    }

    await Size.deleteMany({});
    await Option.deleteMany({});
    await Role.deleteMany({});
    await RolePermission.deleteMany({});
    await PaymentMethod.deleteMany({});
    await LogisticsCategory.deleteMany({});
    console.log('Cleaning completed');
};

const seedRoles = async () => {
    try {
        // Define fixed IDs for catalog roles
        const fixedRoles = [
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4c01"), name: "Admin" },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4c02"), name: "Secretaria" },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4c03"), name: "Comprador" }
        ];

        // Map role names to variables
        let adminRole, secretariaRole, compradorRole;

        // Insert only if the role does not exist
        await Promise.all(
            fixedRoles.map(async (role) => {
                let existingRole = await Role.findById(role._id);
                if (!existingRole) {
                    existingRole = await Role.create(role);
                    console.log(`✅ Inserted role: ${role.name}`);
                } else {
                    console.log(`⚠️ Role already exists: ${role.name}, skipping...`);
                }

                // Assign to variables
                if (role.name === "Admin") adminRole = existingRole;
                if (role.name === "Secretaria") secretariaRole = existingRole;
                if (role.name === "Comprador") compradorRole = existingRole;
            })
        );

        console.log("✅ Roles seeding complete.");
        return { adminRole, secretariaRole, compradorRole };
    } catch (error) {
        console.error("❌ Error seeding roles:", error.message);
        throw new Error("Error seeding roles: " + error.message);
    }
};

const seedOptions = async () => {
    try {
        const options = [
            // { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f01"), name: 'Principal', route: '/home', icon: 'element-11' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f02"), name: 'Perfil Personal', icon: 'profile-circle' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f03"), name: 'Clientes', route: '/clients', icon: 'people' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f04"), name: 'Precios', route: '/prices', icon: 'price-tag' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f05"), name: 'Compras', icon: 'receipt-square' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f06"), name: 'Logística', icon: 'parcel-tracking' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f07"), name: 'Ventas', icon: 'tag' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f08"), name: 'Reportes', icon: 'file-sheet' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f09"), name: 'Administración', icon: 'gear' }
        ];

        const childOptions = [
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f10"), name: 'Mi Perfil', route: '/personal-profile/my-profile', parentName: 'Perfil Personal' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f11"), name: 'Brokers', route: '/personal-profile/brokers', parentName: 'Perfil Personal' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f12"), name: 'Gestionar Compra', route: '/purchases/form', parentName: 'Compras' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f13"), name: 'Compras Recientes', route: '/purchases/list', parentName: 'Compras' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f14"), name: 'Gestionar Logística', route: '/logistics/form', parentName: 'Logística' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f15"), name: 'Logísticas Recientes', route: '/logistics/list', parentName: 'Logística' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f16"), name: 'Compañía', route: '/sales/company', parentName: 'Ventas' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f17"), name: 'Local', route: '/sales/local', parentName: 'Ventas' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f18"), name: 'Ventas Recientes', route: '/sales/list', parentName: 'Ventas' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f19"), name: 'Gestionar Usuarios', route: '/settings/users', parentName: 'Administración' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f20"), name: 'Gestionar Brokers', route: '/settings/brokers', parentName: 'Administración' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f21"), name: 'Gestionar Clientes', route: '/settings/clients', parentName: 'Administración' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f22"), name: 'Gestionar Compañías', route: '/settings/companies', parentName: 'Administración' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f23"), name: 'Reporte Económico', route: '/reports/economic', parentName: 'Reportes' },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4f24"), name: 'Reporte Total', route: '/reports/total', parentName: 'Reportes' },
        ];

        // Fetch existing options in one query
        const existingOptions = await Option.find({ _id: { $in: [...options, ...childOptions].map(opt => opt._id) } });
        const existingIds = new Set(existingOptions.map(opt => opt._id.toString()));

        // 🔹 Insert Parent Options First
        await Promise.all(
            options.map(async (opt) => {
                if (!existingIds.has(opt._id.toString())) {
                    await Option.create(opt);
                    console.log(`✅ Inserted parent option: ${opt.name}`);
                } else {
                    console.log(`⚠️ Parent option already exists: ${opt.name}, skipping...`);
                }
            })
        );

        // 🔹 Fetch Parent IDs After Insertions
        const parentOptionsMap = {};
        const insertedParents = await Option.find({ name: { $in: options.map(o => o.name) } });
        insertedParents.forEach(opt => {
            parentOptionsMap[opt.name] = opt._id;
        });

        // 🔹 Insert Child Options with Correct Parent References
        await Promise.all(
            childOptions.map(async (opt) => {
                if (!existingIds.has(opt._id.toString())) {
                    opt.parentOption = parentOptionsMap[opt.parentName] || null;
                    delete opt.parentName;

                    await Option.create(opt);
                    console.log(`✅ Inserted child option: ${opt.name}`);
                } else {
                    console.log(`⚠️ Child option already exists: ${opt.name}, skipping...`);
                }
            })
        );

        console.log('✅ Options seeding complete.');
    } catch (error) {
        console.error('❌ Error seeding options:', error.message);
    }
};

const seedPermissions = async () => {
    try {
        const roles = await Role.find();
        const options = await Option.find(); // Get all options at once

        const rolePermissions = [];

        for (const role of roles) {
            for (const option of options) {
                let actions = [];

                switch (option.name) {
                    // case 'Principal':
                    case 'Perfil Personal':
                        actions = [Permission.VIEW];
                        break;

                    case 'Mi Perfil':
                        actions = [Permission.VIEW, Permission.EDIT];
                        break;

                    case 'Brokers':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW, Permission.ADD];
                        }
                        break;

                    case 'Clientes':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW, Permission.ADD, Permission.EDIT];
                        }
                        break;

                    case 'Precios':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW];
                        }
                        break;

                    case 'Compras':
                        actions = [Permission.VIEW];
                        break;

                    case 'Gestionar Compra':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW, Permission.ADD];
                        }
                        break;

                    case 'Compras Recientes':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW, Permission.EDIT];
                        }
                        break;

                    case 'Logística':
                        actions = [Permission.VIEW];
                        break;

                    case 'Gestionar Logística':
                        // if (role.name === 'Admin' || role.name === 'Secretaria') {
                        //     actions = [Permission.VIEW, Permission.EDIT, Permission.ADD];
                        // } else if (role.name === 'Comprador') {
                        //     actions = [Permission.VIEW, Permission.ADD];
                        // }
                        actions = [Permission.VIEW, Permission.EDIT, Permission.ADD];
                        break;

                    case 'Logísticas Recientes':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD];
                        }
                        // actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        break;

                    case 'Ventas':
                        actions = [Permission.VIEW];
                        break;

                    case 'Compañía':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;
                    case 'Local':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;
                    case 'Ventas Recientes':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW];
                        }
                        break;

                    case 'Reportes':
                        actions = [Permission.VIEW];
                        break;
                    case 'Reporte Económico':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW];
                        }
                        break;
                    case 'Reporte Total':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW];
                        } else if (role.name === 'Comprador') {
                            actions = [Permission.VIEW];
                        }
                        break;

                    case 'Administración':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;

                    case 'Gestionar Usuarios':
                        if (role.name === 'Admin') {
                            actions = [Permission.VIEW, Permission.ADD, Permission.EDIT, Permission.DELETE];
                        } else if (role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.ADD, Permission.EDIT];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;

                    case 'Gestionar Brokers':
                        if (role.name === 'Admin') {
                            actions = [Permission.VIEW, Permission.ADD, Permission.EDIT, Permission.DELETE];
                        } else if (role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.ADD, Permission.EDIT];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;

                    case 'Gestionar Clientes':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;

                    case 'Gestionar Compañías':
                        if (role.name === 'Admin' || role.name === 'Secretaria') {
                            actions = [Permission.VIEW, Permission.EDIT, Permission.ADD, Permission.DELETE];
                        } else if (role.name === 'Comprador') {
                            actions = [];
                        }
                        break;
                }

                if (actions.length > 0) {
                    // Check if permission already exists
                    const existingPermission = await RolePermission.findOne({
                        role: role._id,
                        option: option._id
                    });

                    if (!existingPermission) {
                        rolePermissions.push({
                            role: role._id,
                            option: option._id,
                            actions
                        });
                        console.log(`✅ Permission assigned: ${role.name} -> ${option.name}`);
                    } else {
                        console.log(`⚠️ Permission already exists: ${role.name} -> ${option.name}, skipping...`);
                    }
                }
            }
        }

        // Bulk insert all new permissions
        if (rolePermissions.length > 0) {
            await RolePermission.insertMany(rolePermissions);
        }

        console.log('✅ Permissions seeding complete.');
    } catch (error) {
        console.error('❌ Error seeding permissions:', error.message);
    }
};

const seedCompanies = async () => {
    try {
        // Define fixed IDs for catalog companies
        const fixedCompanies = [
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4a01"), name: "Edpacific" },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4a02"), name: "Prodex" },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4a03"), name: "Local" },
        ];

        // Insert companies only if they do not exist
        await Promise.all(
            fixedCompanies.map(async (company) => {
                const existingCompany = await Company.findById(company._id);
                if (!existingCompany) {
                    await Company.create(company);
                    console.log(`✅ Inserted company: ${company.name}`);
                } else {
                    console.log(`⚠️ Company already exists: ${company.name}, skipping...`);
                }
            })
        );

        console.log('✅ Companies seeding complete.');
    } catch (error) {
        console.error('❌ Error seeding companies:', error.message);
    }
};

const seedSizes = async () => {
    try {
        // Define fixed IDs for catalog sizes
        const fixedSizes = [
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b10"), size: "20/30", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b11"), size: "30/40", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b12"), size: "40/50", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b13"), size: "50/60", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b14"), size: "60/70", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b15"), size: "70/80", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b16"), size: "80/100", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b17"), size: "100/120", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b18"), size: "Corriente", type: SizeTypeEnum.WHOLE },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b19"), size: "XSBKN", type: SizeTypeEnum.WHOLE },

            // TAIL-A
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b01"), size: "16/20", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b02"), size: "21/25", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b03"), size: "26/30", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b04"), size: "31/35", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b05"), size: "36/40", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b06"), size: "41/50", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b07"), size: "51/60", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b08"), size: "61/70", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b09"), size: "71/90", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b10"), size: "91/110", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b11"), size: "110/130", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b20"), size: "Corriente", type: SizeTypeEnum['TAIL-A'] },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b21"), size: "XSBKN", type: SizeTypeEnum['TAIL-A'] },

            // TAIL-A-
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b12"), size: "16/20", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b13"), size: "21/25", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b14"), size: "26/30", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b15"), size: "31/35", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b16"), size: "36/40", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b17"), size: "41/50", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b18"), size: "51/60", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b19"), size: "61/70", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b20"), size: "71/90", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b21"), size: "91/110", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b22"), size: "110/130", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b22"), size: "Corriente", type: SizeTypeEnum['TAIL-A-'] },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b23"), size: "XSBKN", type: SizeTypeEnum['TAIL-A-'] },

            // TAIL-B
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b23"), size: "16/20", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b24"), size: "21/25", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b25"), size: "26/30", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b26"), size: "31/35", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b27"), size: "36/40", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b28"), size: "41/50", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b29"), size: "51/60", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b30"), size: "61/70", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b31"), size: "71/90", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b32"), size: "91/110", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f9a7b2c8b3f10ffc2e4b33"), size: "110/130", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b24"), size: "Corriente", type: SizeTypeEnum['TAIL-B'] },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b25"), size: "XSBKN", type: SizeTypeEnum['TAIL-B'] },

            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b34"), size: "BR Large", type: SizeTypeEnum.RESIDUAL },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b35"), size: "BR Medium", type: SizeTypeEnum.RESIDUAL },
            { _id: new mongoose.Types.ObjectId("60f8a7b2c8b3f10ffc2e4b36"), size: "BR Small", type: SizeTypeEnum.RESIDUAL },
        ];

        // Insert only if the size does not exist
        await Promise.all(
            fixedSizes.map(async (size) => {
                const existingSize = await Size.findById(size._id);
                if (!existingSize) {
                    await Size.create(size);
                    console.log(`✅ Inserted size: ${size.size} (${size.type})`);
                } else {
                    console.log(`⚠️ Size already exists: ${size.size} (${size.type}), skipping...`);
                }
            })
        );

        console.log("✅ Sizes seeding complete.");
    } catch (error) {
        console.error("❌ Error seeding sizes:", error.message);
    }
};

const seedPaymentMethods = async () => {
    try {
        // Define fixed IDs for catalog payment methods
        const fixedPaymentMethods = [
            { _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5a01"), name: "Efectivo" },
            { _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5a02"), name: "Transferencia" },
            { _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5a03"), name: "Cheque" },
        ];

        // Insert payment methods only if they do not exist
        await Promise.all(
            fixedPaymentMethods.map(async (pm) => {
                const existingPaymentMethod = await PaymentMethod.findById(pm._id);
                if (!existingPaymentMethod) {
                    await PaymentMethod.create(pm);
                    console.log(`✅ Inserted payment method: ${pm.name}`);
                } else {
                    console.log(`⚠️ Payment Method already exists: ${pm.name}, skipping...`);
                }
            })
        );

        console.log('✅ Payment Methods seeding complete.');
    } catch (error) {
        console.error('❌ Error seeding companies:', error.message);
    }
};

const seedLogisticsCategories = async () => {
    try {
        const fixedLogisticsCategories = [
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b01"),
                name: "Trabajadores",
                category: LogisticsCategoryEnum.PERSONNEL,
            },
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b02"),
                name: "Responsable",
                category: LogisticsCategoryEnum.PERSONNEL,
            },
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b03"),
                name: "Responsable 2",
                category: LogisticsCategoryEnum.PERSONNEL,
            },
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b04"),
                name: "Carro",
                category: LogisticsCategoryEnum.INPUTS,
            },
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b05"),
                name: "Hielo",
                category: LogisticsCategoryEnum.INPUTS,
            },
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b06"),
                name: "Comida",
                category: LogisticsCategoryEnum.INPUTS,
            },
            {
                _id: new mongoose.Types.ObjectId("60f9b7b2c8b3f10ffc2e5b07"),
                name: "Otros",
                category: LogisticsCategoryEnum.INPUTS,
            },
        ];

        await Promise.all(
            fixedLogisticsCategories.map(async (cat) => {
                const exists = await LogisticsCategory.findById(cat._id);
                if (!exists) {
                    await LogisticsCategory.create(cat);
                    console.log(`✅ Inserted logistics category: ${cat.name}`);
                } else {
                    console.log(`⚠️ Logistics category already exists: ${cat.name}, skipping...`);
                }
            })
        );

        console.log('✅ Logistics Types seeding complete.');
    } catch (error) {
        console.error('❌ Error seeding logistics types:', error.message);
    }
};

module.exports = {
    seedDatabase
};
