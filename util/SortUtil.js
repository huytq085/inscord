
compare = (property) => {
    return (a, b) => {
        // Use toUpperCase() to ignore character casing
        const pA = a[property].toUpperCase();
        const pB = b[property].toUpperCase();

        let comparison = 0;
        if (pA > pB) {
            comparison = 1;
        } else if (pA < pB) {
            comparison = -1;
        }
        return comparison;
    }

}

compareByTime = (property) => {
    return (a, b) => {
        const pA = Date.parse(a[property]);
        const pB = Date.parse(b[property]);

        let comparison = 0;
        if (pA > pB) {
            comparison = 1;
        } else if (pA < pB) {
            comparison = -1;
        }
        return comparison;
    }

}

compareByNumber = (property) => {
    return (a, b) => {
        return a[property] - b[property];
    }
}

exports.sort = (data, property) => {
    return data.sort(compare(property));
}

exports.sortByUnixTime = (data, property) => {
    return data.sort(compareByNumber(property));
}

exports.sortLocale = (data, property) => {
    return data.sort((a, b) => a[property].localeCompare(b[property]));
}