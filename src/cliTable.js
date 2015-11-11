const Table = require('cli-table');

export function createTable(rows, opts) {
    const table = new Table(opts);

    if (rows) {
        table.push(...rows);
    }

    return table;
}

export function createSimpleTable(rows, opts) {
    return createTable(rows, {
        ...opts,
        chars: {
            'top': '',
            'top-mid': '',
            'top-left': '',
            'top-right': '',
            'bottom': '',
            'bottom-mid': '',
            'bottom-left': '',
            'bottom-right': '',
            'left': '',
            'left-mid': '',
            'mid': '',
            'mid-mid': '',
            'right': '',
            'right-mid': '',
            'middle': ''
        }
    });
}