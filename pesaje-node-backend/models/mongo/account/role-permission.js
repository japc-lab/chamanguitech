const { Schema, model } = require('mongoose');
const PermissionEnum = require('../../../enums/permission.enum');


const RolePermissionSchema = Schema({

    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role'
    },
    option: {
        type: Schema.Types.ObjectId,
        ref: 'Option'
    },
    actions: [{
        type: String,
        enum: PermissionEnum
    }],
},
    { timestamps: true },
);


module.exports = model('RolePermission', RolePermissionSchema);