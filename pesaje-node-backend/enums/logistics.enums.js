const LogisticsTypeEnum = Object.freeze({
    SHIPMENT: "SHIPMENT",
    LOCAL_PROCESSING: "LOCAL_PROCESSING",
});

const LogisticsStatusEnum = Object.freeze({
    DRAFT: "DRAFT",
    CREATED: "CREATED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CONFIRMED: "CONFIRMED",
    CLOSED: "CLOSED",
});

const LogisticsFinanceCategoryEnum = Object.freeze({
    INVOICE: "INVOICE",
    PETTY_CASH: "PETTY_CASH",
    ADDITIONAL: "ADDITIONAL"
});

const LogisticsResourceCategoryEnum = Object.freeze({
    PERSONNEL: "PERSONNEL",
    RESOURCES: "RESOURCES",
});

module.exports = {
    LogisticsTypeEnum,
    LogisticsStatusEnum,
    LogisticsFinanceCategoryEnum,
    LogisticsResourceCategoryEnum
};