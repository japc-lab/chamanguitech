// USA
export const locale = {
  lang: 'en',
  data: {
    TRANSLATOR: {
      SELECT: 'Select your language',
    },
    MENU: {
      NEW: 'new',
      ACTIONS: 'Actions',
      CREATE_POST: 'Create New Post',
      PAGES: 'Pages',
      FEATURES: 'Features',
      APPS: 'Apps',
      DASHBOARD: 'Dashboard',
    },
    AUTH: {
      GENERAL: {
        OR: 'Or',
        SUBMIT_BUTTON: 'Submit',
        NO_ACCOUNT: "Don't have an account?",
        SIGNUP_BUTTON: 'Sign Up',
        FORGOT_BUTTON: 'Forgot Password',
        BACK_BUTTON: 'Back',
        PRIVACY: 'Privacy',
        LEGAL: 'Legal',
        CONTACT: 'Contact',
      },
      LOGIN: {
        TITLE: 'Login Account',
        BUTTON: 'Sign In',
      },
      FORGOT: {
        TITLE: 'Forgotten Password?',
        DESC: 'Enter your email to reset your password',
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
        USERNAME: 'Username',
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
      DELETE_CONFIRM_TITLE: 'Are you sure you want to delete?',
      DELETE_CONFIRM_TEXT: 'This action cannot be undone.',
      DELETE_SUCCESS: 'The item was deleted successfully!',
      PURCHASE_NOT_FOUND: 'Purchase not found.',
      LOGISTICS_LIMIT_REACHED:
        '{{count}} logistics record(s) have already been created for this purchase: {{record}}.',
      NO_SALE_DETAILS_ENTERED: 'No sale details have been entered.',
      SALE_LIMIT_REACHED: 'A sale has already been created for this purchase.',
      INCOMPLETE_TOTAL_REPORT_INFO:
        'The information for the report is incomplete. Please check the purchase, sale, or logistics information.',
    },
    SUCCESS: {
      TITLE: 'Success!',
      MESSAGE: 'The operation was completed successfully.',
    },
    ERROR: {
      TITLE: 'Error',
      MESSAGE: 'An unexpected error occurred. Please try again later.',
      PURCHASE_TOTAL_AGREED_EXCEEDED:
        'Total payments cannot exceed the total agreed amount of ${{total}}',
      COMPANY_SALE_TOTAL_AGREED_EXCEEDED:
        'Total payments cannot exceed the total amount of ${{total}}',
      REPEATED_COMPANY_CODE: 'Company code is already used in other Company.',
    },
    INFO: {
      TITLE: 'Information',
      MESSAGE:
        'Please review the information and complete the required fields.',
    },
    WARNING: {
      TITLE: 'Warning',
      MESSAGE: 'Please review the information before proceeding.',
    },
    BUTTONS: {
      OK: 'Ok',
      CONFIRM: 'Ok',
      CANCEL: 'Cancel',
    },
  },
};
