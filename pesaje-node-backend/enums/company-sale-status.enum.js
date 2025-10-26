const { CREATED } = require("./local-sale-status.enum");

const CompanySaleStatusEnum = Object.freeze({
    CREATED: "CREATED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CLOSED: "CLOSED",
});

module.exports = CompanySaleStatusEnum;
