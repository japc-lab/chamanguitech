class DatabaseAdapter {
    async create(data) {
        throw new Error('Method not implemented');
    }

    async getAll(query) {
        throw new Error('Method not implemented');
    }

    async getById(id) {
        throw new Error('Method not implemented');
    }

    async update(id, data) {
        throw new Error('Method not implemented');
    }

    async remove(id) {
        throw new Error('Method not implemented');
    }

    async removePermanently(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Start a transaction (to be implemented by database-specific adapters)
     */
    async startTransaction() {
        throw new Error('Method not implemented');
    }
}

module.exports = DatabaseAdapter;
