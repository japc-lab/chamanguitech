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
      PURCHASE_NOT_FOUND: 'No se encontró la compra.',
      LOGISTICS_LIMIT_REACHED:
        'Ya se ha(n) creado {{count}} registro(s) logístico(s) permitido(s) para esta compra: {{record}}.',
      NO_SALE_DETAILS_ENTERED: 'No se han ingresado detalles de la venta.',
      SALE_LIMIT_REACHED: 'Ya existe una venta creada para esta compra.',
      INCOMPLETE_TOTAL_REPORT_INFO:
        'La información para el reporte está incompleta. Verifique la información de compra, venta o logística.',
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
      REPEATED_COMPANY_CODE:
        'El código de Compañía ya está en uso en otra Compañía.',
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
    },
  },
};
