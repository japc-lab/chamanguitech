const dbAdapter = require('../adapters');

const getAll = async (type = null) => {
    // Fetch all sizes from the database
    let sizes = await dbAdapter.sizeAdapter.getAll();

    // If type is provided, filter the results in JavaScript
    if (type) {
        const typesArray = type.split(',').map(t => t.trim()); // Convert "TAIL-A,TAIL-B" to ["TAIL-A", "TAIL-B"]
        sizes = sizes.filter(size => typesArray.includes(size.type));
    }

    // Group by type
    const typeGroups = {};
    sizes.forEach(size => {
        const type = size.type || '';
        if (!typeGroups[type]) typeGroups[type] = [];
        typeGroups[type].push(size);
    });

    // Sort each group by size string
    Object.values(typeGroups).forEach(group => {
        group.sort((a, b) => {
            const sizeA = a.size.split('/').map(Number);
            const sizeB = b.size.split('/').map(Number);
            const isNumA = sizeA.every(n => !isNaN(n));
            const isNumB = sizeB.every(n => !isNaN(n));

            if (isNumA && isNumB) {
                return sizeA[0] - sizeB[0] || sizeA[1] - sizeB[1];
            }
            if (isNumA) return -1;
            if (isNumB) return 1;
            // Both are not numbers, sort alphabetically
            return a.size.localeCompare(b.size);
        });
    });

    // Flatten back to a single array, preserving type group order
    const sortedSizes = Object.values(typeGroups).flat();

    return sortedSizes;
};

module.exports = {
    getAll,
};
