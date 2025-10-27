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
      CONFIRM_TITLE: 'Are you sure?',
      CONFIRM_STATUS_TEXT:
        'The information is complete. The status will be updated to Confirmed.',
      PURCHASE_NOT_FOUND: 'Purchase not found.',
      LOGISTICS_LIMIT_REACHED:
        '{{count}} logistics record(s) have already been created for this purchase: {{record}}.',
      NO_SALE_DETAILS_ENTERED: 'No sale details have been entered.',
      LOCAL_COMPANY_SALE_DETAILS_VALIDATION_ERROR:
        'The local company sale details are not valid.',
      NO_COMPLETE_ITEMS: 'No logistics details have been entered.',
      PAYMENT_VALIDATION_ERRORS:
        'There are payment validation errors. Please complete the required fields.',
      SALE_LIMIT_REACHED: 'A sale has already been created for this purchase.',
      INCOMPLETE_TOTAL_REPORT_INFO:
        'The information for the report is incomplete. Please check the purchase, sale, or logistics information.',
      COMPANY_SALE_REQUIRED_FIELDS:
        'Please complete all required fields in the sale details.',
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
      PAYMENT_EXCEEDED_NET_TOTAL:
        'Total payments cannot exceed the net total amount of ${{total}}',
      REPEATED_COMPANY_CODE: 'Company code is already used in other Company.',
      ASSET_PAID_AMOUNT_EXCEEDED:
        'The paid amount cannot be greater than the asset cost.',
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
      ADD: 'Add',
      EDIT: 'Edit',
      DELETE: 'Delete',
      VIEW: 'View',
      SAVE: 'Save',
      PLEASE_WAIT: 'Please wait...',
    },
    TABLE: {
      ACTIONS: 'Actions',
    },
    COMMON: {
      SEARCH: 'Search',
      LOADING: 'Loading...',
    },
    PROFILE: {
      MY_PROFILE: {
        CHANGE_PHOTO: 'Change profile photo',
        TABS: {
          PERSONAL_INFO: 'Personal Information',
          PAYMENT_INFO: 'Payment Information',
        },
      },
      PERSONAL_INFO: {
        TITLE: 'Profile Details',
        EDIT_BUTTON: 'Edit Profile',
        FIELDS: {
          FULL_NAME: 'Full Name',
          IDENTIFICATION: 'Identification',
          BIRTH_DATE: 'Birth Date',
          ADDRESS: 'Address',
          CONTACT: 'Contact',
          EMAIL: 'Email',
          EMERGENCY_CONTACT: 'Emergency Contact',
          AVATAR: 'Avatar',
          PHONES: 'Phones',
          PASSWORD: 'Password',
        },
        CONTACT_LABELS: {
          PHONE: 'Phone:',
          MOBILE_1: 'Mobile 1:',
          MOBILE_2: 'Mobile 2:',
        },
        PLACEHOLDERS: {
          FIRST_NAME: 'First Name',
          LAST_NAME: 'Last Name',
          IDENTIFICATION: 'Identification',
          ADDRESS: 'Address',
          LANDLINE: 'Landline',
          MOBILE_1: 'Mobile 1',
          MOBILE_2: 'Mobile 2',
          EMAIL: 'Email',
          EMERGENCY_NAME: 'Contact Name',
          EMERGENCY_PHONE: 'Contact Phone',
          PASSWORD: '••••••••',
        },
        NOT_AVAILABLE: 'N/A',
      },
      PAYMENT_INFO: {
        TITLE: 'Payment Information',
        MODAL_TITLE: 'Payment Information Details',
        TABLE: {
          ACCOUNT_NUMBER: 'Account #',
          NAME: 'Name',
          IDENTIFICATION: 'Identification',
        },
        FORM: {
          BANK_NAME: 'Bank Name',
          ACCOUNT_NAME: 'Account Name',
          ACCOUNT_NUMBER: 'Account Number',
          IDENTIFICATION: 'Identification',
          MOBILE_PHONE: 'Mobile Phone',
          EMAIL: 'Email',
        },
        VALIDATIONS: {
          BANK_NAME_REQUIRED: 'Bank name is required.',
          BANK_NAME_MIN_LENGTH: 'Must be at least 3 characters.',
          ACCOUNT_NAME_REQUIRED: 'Account name is required.',
          ACCOUNT_NAME_MIN_LENGTH: 'Must be at least 3 characters.',
          ACCOUNT_NUMBER_REQUIRED: 'Account number is required.',
          ACCOUNT_NUMBER_PATTERN: 'Account number must contain only digits.',
          IDENTIFICATION_REQUIRED: 'Identification is required.',
          MOBILE_PHONE_REQUIRED: 'Mobile phone is required.',
          MOBILE_PHONE_PATTERN: 'Enter a valid phone number.',
          EMAIL_REQUIRED: 'Email is required.',
          EMAIL_PATTERN: 'Enter a valid email.',
        },
        MESSAGES: {
          LOAD_ERROR: 'Could not load payment information.',
          DELETE_ERROR: 'Could not delete payment information.',
          UPDATE_SUCCESS: 'Payment information updated successfully.',
          UPDATE_ERROR: 'Could not update payment information.',
          CREATE_SUCCESS: 'Payment information created successfully.',
          CREATE_ERROR: 'Could not create payment information.',
          PERSON_ID_ERROR:
            'Person ID is not available. Cannot save payment information.',
        },
      },
      SHARED: {
        PHOTO: 'Profile Photo',
      },
    },
  },
};
