const LogisticsTypeEnum = Object.freeze({
    SHIPMENT: "SHIPMENT",
    LOCAL_PROCESSING: "LOCAL_PROCESSING",
});

const LogisticsStatusEnum = Object.freeze({
    DRAFT: "DRAFT",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CLOSED: "CLOSED",
});

const LogisticsFinanceCategoryEnum = Object.freeze({
    INVOICE: "INVOICE",
    PETTY_CASH: "PETTY_CASH",
    OTHER: "OTHER"
});

const LogisticsResourceCategoryEnum = Object.freeze({
    PERSONNEL: "PERSONNEL",
    RESOURCES: "RESOURCES",
    MATERIALS: "MATERIALS"
});

module.exports = {
    LogisticsTypeEnum,
    LogisticsStatusEnum,
    LogisticsFinanceCategoryEnum,
    LogisticsResourceCategoryEnum
};