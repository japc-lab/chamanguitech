// Spain
export const locale = {
  lang: 'es',
  data: {
    TRANSLATOR: {
      SELECT: 'Elige tu idioma',
    },
    MENU: {
      NEW: 'nuevo',
      ACTIONS: 'Comportamiento',
      CREATE_POST: 'Crear nueva publicación',
      PAGES: 'Pages',
      FEATURES: 'Caracteristicas',
      APPS: 'Aplicaciones',
      DASHBOARD: 'Tablero',
    },
    AUTH: {
      GENERAL: {
        OR: 'O',
        SUBMIT_BUTTON: 'Enviar',
        NO_ACCOUNT: 'No tienes una cuenta?',
        SIGNUP_BUTTON: 'Regístrate',
        FORGOT_BUTTON: 'Se te olvidó tu contraseña',
        BACK_BUTTON: 'Espalda',
        PRIVACY: 'Intimidad',
        LEGAL: 'Legal',
        CONTACT: 'Contacto',
      },
      LOGIN: {
        TITLE: 'Crear una cuenta',
        BUTTON: 'Registrarse',
      },
      FORGOT: {
        TITLE: 'Contraseña olvidada?',
        DESC: 'Ingrese su correo electrónico para restablecer su contraseña',
        SUCCESS: 'Your account has been successfully reset.',
      },
      REGISTER: {
        TITLE: 'Sign Up',
        DESC: 'Enter your details to create your account',
        SUCCESS: 'Your account has been successfuly registered.',
      },
      INPUT: {
        EMAIL: 'Email',
        FULLNAME: 'Fullname',
        PASSWORD: 'Password',
        CONFIRM_PASSWORD: 'Confirm Password',
        USERNAME: 'Usuario',
      },
      VALIDATION: {
        INVALID: '{{name}} is not valid',
        REQUIRED: '{{name}} is required',
        MIN_LENGTH: '{{name}} minimum length is {{min}}',
        AGREEMENT_REQUIRED: 'Accepting terms & conditions are required',
        NOT_FOUND: 'The requested {{name}} is not found',
        INVALID_LOGIN: 'The login detail is incorrect',
        REQUIRED_FIELD: 'Required field',
        MIN_LENGTH_FIELD: 'Minimum field length:',
        MAX_LENGTH_FIELD: 'Maximum field length:',
        INVALID_FIELD: 'Field is not valid',
      },
    },
    ECOMMERCE: {
      COMMON: {
        SELECTED_RECORDS_COUNT: 'Selected records count: ',
        ALL: 'All',
        SUSPENDED: 'Suspended',
        ACTIVE: 'Active',
        FILTER: 'Filter',
        BY_STATUS: 'by Status',
        BY_TYPE: 'by Type',
        BUSINESS: 'Business',
        INDIVIDUAL: 'Individual',
        SEARCH: 'Search',
        IN_ALL_FIELDS: 'in all fields',
      },
      ECOMMERCE: 'eCommerce',
      CUSTOMERS: {
        CUSTOMERS: 'Customers',
        CUSTOMERS_LIST: 'Customers list',
        NEW_CUSTOMER: 'New Customer',
        DELETE_CUSTOMER_SIMPLE: {
          TITLE: 'Customer Delete',
          DESCRIPTION: 'Are you sure to permanently delete this customer?',
          WAIT_DESCRIPTION: 'Customer is deleting...',
          MESSAGE: 'Customer has been deleted',
        },
        DELETE_CUSTOMER_MULTY: {
          TITLE: 'Customers Delete',
          DESCRIPTION: 'Are you sure to permanently delete selected customers?',
          WAIT_DESCRIPTION: 'Customers are deleting...',
          MESSAGE: 'Selected customers have been deleted',
        },
        UPDATE_STATUS: {
          TITLE: 'Status has been updated for selected customers',
          MESSAGE: 'Selected customers status have successfully been updated',
        },
        EDIT: {
          UPDATE_MESSAGE: 'Customer has been updated',
          ADD_MESSAGE: 'Customer has been created',
        },
      },
    },
    MESSAGES: {
      DELETE_CONFIRM_TITLE: '¿Estás seguro de que deseas eliminar?',
      DELETE_CONFIRM_TEXT: 'Esta acción no se puede deshacer.',
      DELETE_SUCCESS: '¡El elemento fue eliminado exitosamente!',
      CONFIRM_TITLE: '¿Estás seguro?',
      CONFIRM_STATUS_TEXT:
        'La información está completa. El estado se actualizará a Confirmado.',
      PURCHASE_NOT_FOUND: 'No se encontró la compra.',
      LOGISTICS_LIMIT_REACHED:
        'Ya se ha(n) creado {{count}} registro(s) logístico(s) permitido(s) para esta compra: {{record}}.',
      NO_SALE_DETAILS_ENTERED: 'No se han ingresado detalles de la venta.',
      LOCAL_COMPANY_SALE_DETAILS_VALIDATION_ERROR:
        'Los detalles de la venta local de la Compañía no son válidos.',
      NO_COMPLETE_ITEMS: 'No se han ingresado detalles de logística.',
      PAYMENT_VALIDATION_ERRORS:
        'Hay errores de validación en los pagos. Por favor complete los campos requeridos.',
      SALE_LIMIT_REACHED: 'Ya existe una venta creada para esta compra.',
      INCOMPLETE_TOTAL_REPORT_INFO:
        'La información para el reporte está incompleta. Verifique la información de compra, venta o logística.',
      COMPANY_SALE_REQUIRED_FIELDS:
        'Por favor complete todos los campos requeridos en los detalles de venta.',
    },
    SUCCESS: {
      TITLE: '¡Éxito!',
      MESSAGE: 'La operación se completó correctamente.',
    },
    ERROR: {
      TITLE: 'Error',
      MESSAGE:
        'Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.',
      PURCHASE_TOTAL_AGREED_EXCEEDED:
        'Los pagos no pueden exceder el monto total acordado de ${{total}}',
      COMPANY_SALE_TOTAL_AGREED_EXCEEDED:
        'Los pagos no pueden exceder el monto total de ${{total}}',
      PAYMENT_EXCEEDED_NET_TOTAL:
        'Los pagos no pueden exceder el monto neto de ${{total}}',
      REPEATED_COMPANY_CODE:
        'El código de Compañía ya está en uso en otra Compañía.',
      ASSET_PAID_AMOUNT_EXCEEDED:
        'El monto pagado no puede ser mayor al costo del activo.',
    },
    INFO: {
      TITLE: 'Información',
      MESSAGE:
        'Por favor revise la información e ingrese los campos requeridos.',
    },
    WARNING: {
      TITLE: 'Advertencia',
      MESSAGE: 'Por favor, revisa la información antes de continuar.',
    },
    BUTTONS: {
      OK: 'Entendido',
      CONFIRM: 'Aceptar',
      CANCEL: 'Cancelar',
      ADD: 'Agregar',
      EDIT: 'Editar',
      DELETE: 'Eliminar',
      VIEW: 'Ver',
      SAVE: 'Guardar',
      PLEASE_WAIT: 'Por favor, espere...',
    },
    TABLE: {
      ACTIONS: 'Acciones',
    },
    COMMON: {
      SEARCH: 'Buscar',
      LOADING: 'Cargando...',
      NEW: 'Nuevo',
      NO_DATA_AVAILABLE: 'No hay datos disponibles para mostrar',
    },
    SIZE_PRICE: {
      TITLE: 'Períodos',
      NEW_PERIOD_TITLE: 'Nuevo Periodo',
      BEST_PRICES_TITLE: 'Mejores Precios',
      SELECT_PERIOD_MESSAGE: 'Selecciona un periodo para ver sus precios por talla.',
      FIELDS: {
        COMPANY: 'Compañía',
        PERIOD: 'Período',
        YEAR: 'Año',
        PERIOD_NUMBER: 'Periodo',
        RECEIVED_DATE: 'Fecha de recibido',
        RECEIVED_TIME: 'Hora de recibido',
        PERIOD_START_DATE: 'Fecha inicio periodo',
        PERIOD_END_DATE: 'Fecha fin periodo',
        TIME_OF_DAY: 'Hora del día',
      },
      PLACEHOLDERS: {
        SELECT_OPTION: 'Seleccione una opción',
        PERIOD_NUMBER: '0',
      },
      TIME_OPTIONS: {
        DAY: 'Día',
        NIGHT: 'Noche',
      },
      VALIDATIONS: {
        COMPANY_REQUIRED: 'Debe seleccionar una compañía',
        PERIOD_REQUIRED: 'Debe seleccionar un mes',
        YEAR_REQUIRED: 'Debe seleccionar un año',
        PERIOD_NUMBER_REQUIRED: 'Debe ingresar un periodo',
        RECEIVED_DATE_REQUIRED: 'La fecha de recibido es obligatoria.',
        RECEIVED_TIME_REQUIRED: 'La hora de recibido es obligatoria.',
        PERIOD_START_DATE_REQUIRED: 'La fecha de inicio del periodo es obligatoria.',
        PERIOD_END_DATE_REQUIRED: 'La fecha de fin del periodo es obligatoria.',
        TIME_OF_DAY_REQUIRED: 'La hora del día es obligatoria.',
        PERIOD_SELECTION_REQUIRED: 'Debe seleccionar un período',
      },
      TABLES: {
        HEADLESS: 'Cola',
        WHOLE: 'Entero',
        RESIDUAL: 'Residual',
        COLUMNS: {
          SIZE: 'Talla',
          PRICE: 'Precio ($)',
          PRICE_TAIL_A: 'Precio ($) Cola A',
          PRICE_TAIL_A_MINUS: 'Precio ($) Cola A-',
          PRICE_TAIL_B: 'Precio ($) Cola B',
        },
        PLACEHOLDERS: {
          PRICE: '0.00',
        },
        VALIDATIONS: {
          INVALID_NUMBER: 'Ingrese un número válido',
        },
      },
    },
    PROFILE: {
      MY_PROFILE: {
        CHANGE_PHOTO: 'Cambiar foto de perfil',
        TABS: {
          PERSONAL_INFO: 'Información Personal',
          PAYMENT_INFO: 'Información de Pago',
        },
      },
      PERSONAL_INFO: {
        TITLE: 'Detalles de Perfil',
        EDIT_BUTTON: 'Editar Perfil',
        FIELDS: {
          FULL_NAME: 'Nombre Completo',
          IDENTIFICATION: 'Identificación',
          BIRTH_DATE: 'Fecha de Nacimiento',
          ADDRESS: 'Dirección',
          CONTACT: 'Contacto',
          EMAIL: 'Correo Electrónico',
          EMERGENCY_CONTACT: 'Contacto de Emergencia',
          AVATAR: 'Avatar',
          PHONES: 'Teléfonos',
          PASSWORD: 'Contraseña',
        },
        CONTACT_LABELS: {
          PHONE: 'Teléfono:',
          MOBILE_1: 'Celular 1:',
          MOBILE_2: 'Celular 2:',
        },
        PLACEHOLDERS: {
          FIRST_NAME: 'Nombres',
          LAST_NAME: 'Apellidos',
          IDENTIFICATION: 'Identificación',
          ADDRESS: 'Dirección',
          LANDLINE: 'Teléfono fijo',
          MOBILE_1: 'Celular 1',
          MOBILE_2: 'Celular 2',
          EMAIL: 'Correo electrónico',
          EMERGENCY_NAME: 'Nombre contacto',
          EMERGENCY_PHONE: 'Teléfono contacto',
          PASSWORD: '••••••••',
        },
        NOT_AVAILABLE: 'N/D',
      },
      PAYMENT_INFO: {
        TITLE: 'Información de Pago',
        MODAL_TITLE: 'Detalles de Información de Pago',
        TABLE: {
          ACCOUNT_NUMBER: '# Cuenta',
          NAME: 'Nombre',
          IDENTIFICATION: 'Identificación',
        },
        FORM: {
          BANK_NAME: 'Nombre del Banco',
          ACCOUNT_NAME: 'Nombre de la Cuenta',
          ACCOUNT_NUMBER: 'Número de Cuenta',
          IDENTIFICATION: 'Identificación',
          MOBILE_PHONE: 'Teléfono Móvil',
          EMAIL: 'Correo Electrónico',
        },
        VALIDATIONS: {
          BANK_NAME_REQUIRED: 'El nombre del banco es obligatorio.',
          BANK_NAME_MIN_LENGTH: 'Debe tener al menos 3 caracteres.',
          ACCOUNT_NAME_REQUIRED: 'El nombre de la cuenta es obligatorio.',
          ACCOUNT_NAME_MIN_LENGTH: 'Debe tener al menos 3 caracteres.',
          ACCOUNT_NUMBER_REQUIRED: 'El número de cuenta es obligatorio.',
          ACCOUNT_NUMBER_PATTERN:
            'El número de cuenta debe contener solo dígitos.',
          IDENTIFICATION_REQUIRED: 'La identificación es obligatoria.',
          MOBILE_PHONE_REQUIRED: 'El teléfono móvil es obligatorio.',
          MOBILE_PHONE_PATTERN: 'Ingrese un número de teléfono válido.',
          EMAIL_REQUIRED: 'El correo electrónico es obligatorio.',
          EMAIL_PATTERN: 'Debe ingresar un correo válido.',
        },
        MESSAGES: {
          LOAD_ERROR: 'No se pudo cargar la información de pago.',
          DELETE_ERROR: 'No se pudo eliminar la información de pago.',
          UPDATE_SUCCESS: 'Información de pago actualizada correctamente.',
          UPDATE_ERROR: 'No se pudo actualizar la información de pago.',
          CREATE_SUCCESS: 'Información de pago creada correctamente.',
          CREATE_ERROR: 'No se pudo crear la información de pago.',
          PERSON_ID_ERROR:
            'El ID de persona no está disponible. No se puede guardar la información de pago.',
        },
      },
      SHARED: {
        PHOTO: 'Foto de Perfil',
      },
    },
  },
};
