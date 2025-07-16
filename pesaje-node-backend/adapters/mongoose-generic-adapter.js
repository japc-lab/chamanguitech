const DatabaseAdapter = require('./database-adapter');
const mongoose = require('mongoose');

class MongooseGenericAdapter extends DatabaseAdapter {
    constructor(model, relations = []) {
        super();
        this.model = model;
        this.relations = relations; // Default relations to populate
    }

    async create(data) {
        const document = await this.model.create(data);
        return this.transformDocument(document);
    }

    async getAll(query = {}) {
        const documents = await this.model.find(query);
        return documents.map(doc => this.transformDocument(doc));
    }

    async getAllWithRelations(query = {}, relations = []) {
        const populateFields = relations.length ? relations : this.relations;
        const documents = populateFields.length
            ? await this.model.find(query).populate(populateFields)
            : await this.model.find(query);
        return documents.map(doc => this.transformDocument(doc));
    }

    async getById(id) {
        const document = await this.model.findById(id);
        return document ? this.transformDocument(document) : null;
    }

    async getByIdWithRelations(id, relations = []) {
        const populateFields = relations.length ? relations : this.relations;
        const document = populateFields.length
            ? await this.model.findById(id).populate(populateFields)
            : await this.model.findById(id);
        return document ? this.transformDocument(document) : null;
    }

    async update(id, data) {
        const updatedDocument = await this.model.findByIdAndUpdate(id, data, { new: true });
        return updatedDocument ? this.transformDocument(updatedDocument) : null;
    }

    async remove(id) {
        const deletedDocument = await this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
        return deletedDocument ? this.transformDocument(deletedDocument) : null;
    }

    async removePermanently(id) {
        const result = await this.model.findByIdAndDelete(id);
        return result ? this.transformDocument(result) : null;
    }


    /**
     * Start a MongoDB Transaction Session
     */
    async startTransaction() {
        const session = await mongoose.startSession();
        session.startTransaction();
        return {
            session,
            commit: async () => await session.commitTransaction(),
            rollback: async () => await session.abortTransaction(),
            end: async () => await session.endSession()
        };
    }

    /**
     * Apply `toJSON()` transformation to the main document and its populated fields.
     */
    transformDocument(doc) {
        if (!doc || typeof doc.toJSON !== 'function') return null;

        const transformedDoc = doc.toJSON();
        const { ...mainObject } = transformedDoc;

        Object.keys(transformedDoc).forEach(key => {
            const field = doc[key];
            if (typeof field === 'object' && field !== null) {
                if (Array.isArray(field)) {
                    mainObject[key] = field.map(item => (item?.toJSON ? item.toJSON() : item));
                } else if (typeof field.toJSON === 'function') {
                    mainObject[key] = field.toJSON();
                } else {
                    mainObject[key] = field;
                }
            }
        });

        return mainObject;
    }

}

module.exports = MongooseGenericAdapter;
